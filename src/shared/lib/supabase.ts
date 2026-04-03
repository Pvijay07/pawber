import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { env } from '../../config';

const pool = new Pool(env.DATABASE_URL ? {
    connectionString: env.DATABASE_URL,
    ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
} : {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASS,
    database: env.DB_NAME,
});

/**
 * A lightweight shim that mimics the Supabase query builder (postgrest-js)
 * but executes raw SQL against a local PostgreSQL database.
 */
class PostgresQueryBuilder {
    // ... (keeping existing implementation for fallback)
    private table: string;
    private _select: string = '*';
    private _filters: { col: string; val: any; op: string; isOr?: boolean }[] = [];
    private _type: 'select' | 'insert' | 'update' | 'delete' = 'select';
    private _payload: any = null;
    private _single: boolean = false;
    private _order: string | null = null;
    private _limit: number | null = null;
    private _offset: number | null = null;
    private _countOnly: boolean = false;
    private _joins: string[] = [];
    private _group: string | null = null;

    constructor(table: string) {
        this.table = table;
    }

    select(columns: string = '*', options?: { count?: string, head?: boolean }) {
        if (columns.includes(':')) {
            let parts: string[] = [];
            let current = '';
            let depth = 0;
            for (let i = 0; i < columns.length; i++) {
                const char = columns[i];
                if (char === '(') depth++;
                else if (char === ')') depth--;
                if (char === ',' && depth === 0) {
                    parts.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            if (current) parts.push(current.trim());
            
            const selectParts: string[] = [];
            
            parts.forEach(p => {
                if (p.includes(':') && p.includes('(')) {
                    const [aliasTable, colsWithParens] = p.split('(');
                    const [alias, relTable] = aliasTable.split(':');
                    const relCols = colsWithParens.replace(')', '').split(',').map(c => `"${relTable}"."${c.trim()}"`);
                    
                    let fkColumn = `${relTable.replace(/s$/, '')}_id`;
                    if (this.table === 'services' && relTable === 'service_categories') fkColumn = 'category_id';
                    if (this.table === 'providers' && relTable === 'profiles') fkColumn = 'user_id';
                    if (this.table === 'pets' && relTable === 'profiles') fkColumn = 'user_id';
                    if (this.table === 'bookings' && relTable === 'profiles') fkColumn = 'user_id';

                    this._joins.push(`LEFT JOIN "${relTable}" ON "${this.table}"."${fkColumn}" = "${relTable}"."id"`);
                    selectParts.push(...relCols.map((c, i) => `${c} AS "${alias}_${relTable.replace(/s$/, '')}_${i}"`));
                } else {
                    if (p === '*') {
                        selectParts.push(`"${this.table}".*`);
                    } else {
                        selectParts.push(`"${this.table}"."${p}"`);
                    }
                }
            });
            this._select = selectParts.join(', ');
        } else {
            this._select = columns === '*' ? '*' : columns.split(',').map(c => `"${this.table}"."${c.trim()}"`).join(', ');
        }
        
        this._type = 'select';
        if (options?.head) {
            this._countOnly = true;
        }
        return this;
    }

    insert(payload: any) {
        this._type = 'insert';
        this._payload = payload;
        return this;
    }

    update(payload: any) {
        this._type = 'update';
        this._payload = payload;
        return this;
    }

    delete() {
        this._type = 'delete';
        return this;
    }

    eq(col: string, val: any) {
        this._filters.push({ col, val, op: '=' });
        return this;
    }

    neq(col: string, val: any) {
        this._filters.push({ col, val, op: '<>' });
        return this;
    }

    gt(col: string, val: any) {
        this._filters.push({ col, val, op: '>' });
        return this;
    }

    gte(col: string, val: any) {
        this._filters.push({ col, val, op: '>=' });
        return this;
    }

    lt(col: string, val: any) {
        this._filters.push({ col, val, op: '<' });
        return this;
    }

    lte(col: string, val: any) {
        this._filters.push({ col, val, op: '<=' });
        return this;
    }

    in(col: string, vals: any[]) {
        this._filters.push({ col, val: vals, op: 'IN' });
        return this;
    }

    is(col: string, val: any) {
        if (val === null) {
            this._filters.push({ col, val: null, op: 'IS NULL' });
        } else {
            this._filters.push({ col, val, op: '=' });
        }
        return this;
    }

    or(filter: string) {
        const parts = filter.split(',');
        parts.forEach(p => {
            const [col, op, val] = p.split('.');
            let actualOp = '=';
            if (op === 'eq') actualOp = '=';
            else if (op === 'neq') actualOp = '<>';
            else if (op === 'gt') actualOp = '>';
            else if (op === 'gte') actualOp = '>=';
            else if (op === 'lt') actualOp = '<';
            else if (op === 'lte') actualOp = '<=';
            
            this._filters.push({ col, val, op: actualOp, isOr: true });
        });
        return this;
    }

    ilike(col: string, val: any) {
        this._filters.push({ col, val: val.replace(/\*/g, '%'), op: 'ILIKE' });
        return this;
    }

    match(obj: Record<string, any>) {
        for (const [col, val] of Object.entries(obj)) {
            this._filters.push({ col, val, op: '=' });
        }
        return this;
    }

    order(col: string, options?: { ascending: boolean }) {
        this._order = `"${col}" ${options?.ascending === false ? 'DESC' : 'ASC'}`;
        return this;
    }

    limit(n: number, options?: any) {
        this._limit = n;
        return this;
    }

    range(from: number, to: number) {
        this._offset = from;
        this._limit = to - from + 1;
        return this;
    }

    single() {
        this._single = true;
        return this;
    }

    async then(resolve: (value: any) => void, reject: (reason?: any) => void) {
        try {
            let sql = '';
            let values: any[] = [];

            if (this._type === 'select') {
                sql = `SELECT ${this._select} FROM "${this.table}"`;
                if (this._joins.length > 0) sql += ' ' + this._joins.join(' ');
                const whereClause: string[] = [];
                const orClause: string[] = [];
                this._filters.forEach(f => {
                    if (f.isOr) {
                        const placeholder = `$${values.length + 1}`;
                        orClause.push(`"${this.table}"."${f.col}" ${f.op} ${placeholder}`);
                        values.push(f.val);
                    } else if (f.op === 'IN') {
                        const placeholders = f.val.map((_: any, i: number) => `$${values.length + i + 1}`);
                        whereClause.push(`"${this.table}"."${f.col}" IN (${placeholders.join(', ')})`);
                        values.push(...f.val);
                    } else if (f.op === 'IS NULL') {
                        whereClause.push(`"${this.table}"."${f.col}" IS NULL`);
                    } else {
                        const placeholder = `$${values.length + 1}`;
                        whereClause.push(`"${this.table}"."${f.col}" ${f.op} ${placeholder}`);
                        values.push(f.val);
                    }
                });
                if (whereClause.length > 0 || orClause.length > 0) {
                    sql += ' WHERE ';
                    const parts = [];
                    if (whereClause.length > 0) parts.push(whereClause.join(' AND '));
                    if (orClause.length > 0) parts.push('(' + orClause.join(' OR ') + ')');
                    sql += parts.join(' AND ');
                }
                if (this._order) sql += ` ORDER BY ${this._order}`;
                if (this._limit) sql += ` LIMIT ${this._limit}`;
                if (this._offset) sql += ` OFFSET ${this._offset}`;
            } else if (this._type === 'insert') {
                const data = Array.isArray(this._payload) ? this._payload : [this._payload];
                if (data.length === 0) return resolve({ data: [], error: null });
                const cols = Object.keys(data[0]);
                sql = `INSERT INTO "${this.table}" ("${cols.join('", "')}") VALUES `;
                const rowsSql: string[] = [];
                data.forEach((row, i) => {
                    const rowVals = cols.map((_, j) => `$${i * cols.length + j + 1}`);
                    rowsSql.push(`(${rowVals.join(', ')})`);
                    values.push(...cols.map(c => row[c]));
                });
                sql += rowsSql.join(', ') + ' RETURNING *';
            } else if (this._type === 'update') {
                const data = this._payload;
                const cols = Object.keys(data);
                sql = `UPDATE "${this.table}" SET ` + cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
                values = cols.map(c => data[c]);
                if (this._filters.length > 0) {
                    sql += ' WHERE ' + this._filters.map((f, i) => `"${this.table}"."${f.col}" ${f.op} $${values.length + i + 1}`).join(' AND ');
                    values.push(...this._filters.map(f => f.val));
                }
                sql += ' RETURNING *';
            } else if (this._type === 'delete') {
                sql = `DELETE FROM "${this.table}"`;
                if (this._filters.length > 0) {
                    sql += ' WHERE ' + this._filters.map((f, i) => `"${this.table}"."${f.col}" ${f.op} $${i + 1}`).join(' AND ');
                    values = this._filters.map(f => f.val);
                }
                sql += ' RETURNING *';
            }
            const res = await pool.query(sql, values);
            const data = this._countOnly ? [] : res.rows;
            const count = res.rowCount;
            if (this._single) return resolve({ data: data[0] || null, error: null, count });
            return resolve({ data, error: null, count });
        } catch (err: any) {
            console.error(`DB Error (${this.table}):`, err.message);
            return resolve({ data: null, error: { message: err.message || 'Unknown database error' } });
        }
    }
}

/** 
 * Actual implementation of Supabase client if configured, 
 * otherwise fallback to shim.
 */
let supabaseAdmin: any;

if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(`✅ Using real Supabase: ${env.SUPABASE_URL}`);
    console.log(`🔑 Key length: ${env.SUPABASE_SERVICE_ROLE_KEY.length}, Start: ${env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 15)}...`);
    supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
} else {
    console.log('⚠️ Using local PostgreSQL shim for Supabase');
    const auth = {
        signInWithPassword: async ({ email, password }: any) => {
            try {
                const { rows } = await pool.query('SELECT * FROM auth_users WHERE email = $1 AND password = $2', [email, password]);
                if (rows.length === 0) return { data: { user: null, session: null }, error: { message: 'Invalid credentials' } };
                const user = rows[0];
                const accessToken = jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET || 'secret', { expiresIn: '1h' });
                return {
                    data: {
                        user: { id: user.id, email: user.email },
                        session: { access_token: accessToken, refresh_token: 'local-refresh-token', expires_at: Math.floor(Date.now()/1000) + 3600 }
                    },
                    error: null
                };
            } catch (err: any) {
                return { data: null, error: { message: err.message } };
            }
        },
        getUser: async (token: string) => {
            try {
                const decoded: any = jwt.verify(token, env.JWT_SECRET || 'secret');
                return { data: { user: { id: decoded.sub, email: decoded.email } }, error: null };
            } catch (err) {
                return { data: { user: null }, error: { message: 'Invalid token' } };
            }
        },
        // ... (remaining shim methods)
        refreshSession: async ({ refresh_token }: any) => {
            return { data: { session: { access_token: 'new-local-token', refresh_token: 'local-refresh-token', expires_at: Math.floor(Date.now()/1000) + 3600 } }, error: null };
        },
        admin: {
            createUser: async ({ email, password }: any) => {
                try {
                    const { rows } = await pool.query('INSERT INTO auth_users (email, password) VALUES ($1, $2) RETURNING id, email', [email, password]);
                    return { data: { user: rows[0] }, error: null };
                } catch (err: any) {
                    return { data: null, error: { message: err.message } };
                }
            },
            deleteUser: async (id: string) => {
                await pool.query('DELETE FROM auth_users WHERE id = $1', [id]);
                return { data: null, error: null };
            },
            signOut: async (_token?: string) => ({ data: null, error: null })
        }
    };

    supabaseAdmin = {
        from: (table: string) => new PostgresQueryBuilder(table),
        auth,
        rpc: async (fn: string, params: any) => {
            if (fn === 'increment_slot_booking') {
                const { rows } = await pool.query('SELECT increment_slot_booking($1)', [params.p_slot_id]);
                return { data: rows[0].increment_slot_booking, error: null };
            }
            return { data: null, error: { message: `RPC ${fn} not implemented in shim` } };
        }
    };
}

export const supabasePublic = supabaseAdmin;
export { supabaseAdmin };

export function createSupabaseClient(token: string) {
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        });
    }
    return supabaseAdmin;
}

export function isSupabaseConfigured() {
    return !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}
