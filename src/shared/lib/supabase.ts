import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { env } from '../../config';

const pool = new Pool({
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
    private table: string;
    private _select: string = '*';
    private _filters: { col: string; val: any; op: string }[] = [];
    private _type: 'select' | 'insert' | 'update' | 'delete' = 'select';
    private _payload: any = null;
    private _single: boolean = false;
    private _order: string | null = null;
    private _limit: number | null = null;

    constructor(table: string) {
        this.table = table;
    }

    select(columns: string = '*') {
        this._select = columns;
        this._type = 'select';
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

    limit(n: number) {
        this._limit = n;
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
                sql = `SELECT ${this._select} FROM ${this.table}`;
                if (this._filters.length > 0) {
                    sql += ' WHERE ' + this._filters.map((f, i) => `"${f.col}" ${f.op} $${i + 1}`).join(' AND ');
                    values = this._filters.map(f => f.val);
                }
                if (this._order) sql += ` ORDER BY ${this._order}`;
                if (this._limit) sql += ` LIMIT ${this._limit}`;
            } else if (this._type === 'insert') {
                const data = Array.isArray(this._payload) ? this._payload : [this._payload];
                if (data.length === 0) return resolve({ data: [], error: null });
                
                const cols = Object.keys(data[0]);
                sql = `INSERT INTO ${this.table} ("${cols.join('", "')}") VALUES `;
                const rowsSql: string[] = [];
                data.forEach((row, i) => {
                    const rowVals = cols.map((_, j) => `$${i * cols.length + j + 1}`);
                    rowsSql.push(`(${rowVals.join(', ')})`);
                    values.push(...cols.map(c => row[c]));
                });
                sql += rowsSql.join(', ') + ' RETURNING *';
            } else if (this._type === 'update') {
                const cols = Object.keys(this._payload);
                sql = `UPDATE ${this.table} SET ` + cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
                values = cols.map(c => this._payload[c]);
                if (this._filters.length > 0) {
                    sql += ' WHERE ' + this._filters.map((f, i) => `"${f.col}" ${f.op} $${values.length + i + 1}`).join(' AND ');
                    values.push(...this._filters.map(f => f.val));
                }
                sql += ' RETURNING *';
            } else if (this._type === 'delete') {
                sql = `DELETE FROM ${this.table}`;
                if (this._filters.length > 0) {
                    sql += ' WHERE ' + this._filters.map((f, i) => `"${f.col}" ${f.op} $${i + 1}`).join(' AND ');
                    values = this._filters.map(f => f.val);
                }
                sql += ' RETURNING *';
            }

            const res = await pool.query(sql, values);
            let data = res.rows;
            if (this._single) data = data[0] || null;

            return resolve({ data, error: null });
        } catch (err: any) {
            console.error(`DB Error (${this.table}):`, err.message, err.detail);
            return resolve({ data: null, error: { message: err.message, details: err.detail } });
        }
    }
}

/** 
 * Mock implementation of Supabase Auth using local PostgreSQL auth_users table
 */
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
    refreshSession: async ({ refresh_token }: any) => {
        return { data: { session: { access_token: 'new-local-token', refresh_token: 'local-refresh-token' } }, error: null };
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
        signOut: async () => ({ data: null, error: null })
    }
};

export const supabaseAdmin = {
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

export const supabasePublic = supabaseAdmin;

export function createSupabaseClient(token: string) {
    return supabaseAdmin;
}

export function isSupabaseConfigured() {
    return true;
}
