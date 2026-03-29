"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabasePublic = exports.supabaseAdmin = void 0;
exports.createSupabaseClient = createSupabaseClient;
exports.isSupabaseConfigured = isSupabaseConfigured;
const pg_1 = require("pg");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../config");
const pool = new pg_1.Pool(config_1.env.DATABASE_URL ? {
    connectionString: config_1.env.DATABASE_URL,
    ssl: config_1.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
} : {
    host: config_1.env.DB_HOST,
    port: config_1.env.DB_PORT,
    user: config_1.env.DB_USER,
    password: config_1.env.DB_PASS,
    database: config_1.env.DB_NAME,
});
/**
 * A lightweight shim that mimics the Supabase query builder (postgrest-js)
 * but executes raw SQL against a local PostgreSQL database.
 */
class PostgresQueryBuilder {
    table;
    _select = '*';
    _filters = [];
    _type = 'select';
    _payload = null;
    _single = false;
    _order = null;
    _limit = null;
    _offset = null;
    _countOnly = false;
    _joins = [];
    _group = null;
    constructor(table) {
        this.table = table;
    }
    select(columns = '*', options) {
        // Simple support for relation joins: "*, user:profiles(*)"
        if (columns.includes(':')) {
            const parts = columns.split(',').map(p => p.trim());
            const selectParts = [];
            parts.forEach(p => {
                if (p.includes(':') && p.includes('(')) {
                    // Extract relation info: "alias:table(cols)"
                    const [aliasTable, colsWithParens] = p.split('(');
                    const [alias, relTable] = aliasTable.split(':');
                    const relCols = colsWithParens.replace(')', '').split(',').map(c => `"${relTable}"."${c.trim()}"`);
                    // Simple LEFT JOIN
                    this._joins.push(`LEFT JOIN "${relTable}" ON "${this.table}"."${relTable.replace(/s$/, '')}_id" = "${relTable}"."id"`);
                    // JSON aggregation or just columns (mocking simple structure)
                    // For now, let's keep it simple: just grab the columns
                    selectParts.push(...relCols.map((c, i) => `${c} AS "${alias}_${relTable.replace(/s$/, '')}_${i}"`));
                }
                else {
                    selectParts.push(`"${this.table}"."${p}"`);
                }
            });
            this._select = selectParts.join(', ');
        }
        else {
            this._select = columns === '*' ? '*' : columns.split(',').map(c => `"${this.table}"."${c.trim()}"`).join(', ');
        }
        this._type = 'select';
        if (options?.head) {
            this._countOnly = true;
        }
        return this;
    }
    insert(payload) {
        this._type = 'insert';
        this._payload = payload;
        return this;
    }
    update(payload) {
        this._type = 'update';
        this._payload = payload;
        return this;
    }
    delete() {
        this._type = 'delete';
        return this;
    }
    eq(col, val) {
        this._filters.push({ col, val, op: '=' });
        return this;
    }
    neq(col, val) {
        this._filters.push({ col, val, op: '<>' });
        return this;
    }
    gt(col, val) {
        this._filters.push({ col, val, op: '>' });
        return this;
    }
    gte(col, val) {
        this._filters.push({ col, val, op: '>=' });
        return this;
    }
    lt(col, val) {
        this._filters.push({ col, val, op: '<' });
        return this;
    }
    lte(col, val) {
        this._filters.push({ col, val, op: '<=' });
        return this;
    }
    in(col, vals) {
        this._filters.push({ col, val: vals, op: 'IN' });
        return this;
    }
    is(col, val) {
        if (val === null) {
            this._filters.push({ col, val: null, op: 'IS NULL' });
        }
        else {
            this._filters.push({ col, val, op: '=' });
        }
        return this;
    }
    or(filter) {
        // Simple parser for "col1.eq.val1,col2.eq.val2"
        const parts = filter.split(',');
        parts.forEach(p => {
            const [col, op, val] = p.split('.');
            let actualOp = '=';
            if (op === 'eq')
                actualOp = '=';
            else if (op === 'neq')
                actualOp = '<>';
            else if (op === 'gt')
                actualOp = '>';
            else if (op === 'gte')
                actualOp = '>=';
            else if (op === 'lt')
                actualOp = '<';
            else if (op === 'lte')
                actualOp = '<=';
            this._filters.push({ col, val, op: actualOp, isOr: true });
        });
        return this;
    }
    ilike(col, val) {
        this._filters.push({ col, val: val.replace(/\*/g, '%'), op: 'ILIKE' });
        return this;
    }
    match(obj) {
        for (const [col, val] of Object.entries(obj)) {
            this._filters.push({ col, val, op: '=' });
        }
        return this;
    }
    order(col, options) {
        this._order = `"${col}" ${options?.ascending === false ? 'DESC' : 'ASC'}`;
        return this;
    }
    limit(n, options) {
        this._limit = n;
        return this;
    }
    range(from, to) {
        this._offset = from;
        this._limit = to - from + 1;
        return this;
    }
    single() {
        this._single = true;
        return this;
    }
    async then(resolve, reject) {
        try {
            let sql = '';
            let values = [];
            if (this._type === 'select') {
                sql = `SELECT ${this._select} FROM "${this.table}"`;
                if (this._joins.length > 0)
                    sql += ' ' + this._joins.join(' ');
                const whereClause = [];
                const orClause = [];
                this._filters.forEach(f => {
                    if (f.isOr) {
                        const placeholder = `$${values.length + 1}`;
                        orClause.push(`"${this.table}"."${f.col}" ${f.op} ${placeholder}`);
                        values.push(f.val);
                    }
                    else if (f.op === 'IN') {
                        const placeholders = f.val.map((_, i) => `$${values.length + i + 1}`);
                        whereClause.push(`"${this.table}"."${f.col}" IN (${placeholders.join(', ')})`);
                        values.push(...f.val);
                    }
                    else if (f.op === 'IS NULL') {
                        whereClause.push(`"${this.table}"."${f.col}" IS NULL`);
                    }
                    else {
                        const placeholder = `$${values.length + 1}`;
                        whereClause.push(`"${this.table}"."${f.col}" ${f.op} ${placeholder}`);
                        values.push(f.val);
                    }
                });
                if (whereClause.length > 0 || orClause.length > 0) {
                    sql += ' WHERE ';
                    const parts = [];
                    if (whereClause.length > 0)
                        parts.push(whereClause.join(' AND '));
                    if (orClause.length > 0)
                        parts.push('(' + orClause.join(' OR ') + ')');
                    sql += parts.join(' AND ');
                }
                if (this._order)
                    sql += ` ORDER BY ${this._order}`;
                if (this._limit)
                    sql += ` LIMIT ${this._limit}`;
                if (this._offset)
                    sql += ` OFFSET ${this._offset}`;
            }
            else if (this._type === 'insert') {
                const data = Array.isArray(this._payload) ? this._payload : [this._payload];
                if (data.length === 0)
                    return resolve({ data: [], error: null });
                const cols = Object.keys(data[0]);
                sql = `INSERT INTO "${this.table}" ("${cols.join('", "')}") VALUES `;
                const rowsSql = [];
                data.forEach((row, i) => {
                    const rowVals = cols.map((_, j) => `$${i * cols.length + j + 1}`);
                    rowsSql.push(`(${rowVals.join(', ')})`);
                    values.push(...cols.map(c => row[c]));
                });
                sql += rowsSql.join(', ') + ' RETURNING *';
            }
            else if (this._type === 'update') {
                const data = this._payload;
                const cols = Object.keys(data);
                sql = `UPDATE "${this.table}" SET ` + cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
                values = cols.map(c => data[c]);
                if (this._filters.length > 0) {
                    sql += ' WHERE ' + this._filters.map((f, i) => `"${this.table}"."${f.col}" ${f.op} $${values.length + i + 1}`).join(' AND ');
                    values.push(...this._filters.map(f => f.val));
                }
                sql += ' RETURNING *';
            }
            else if (this._type === 'delete') {
                sql = `DELETE FROM "${this.table}"`;
                if (this._filters.length > 0) {
                    sql += ' WHERE ' + this._filters.map((f, i) => `"${this.table}"."${f.col}" ${f.op} $${i + 1}`).join(' AND ');
                    values = this._filters.map(f => f.val);
                }
                sql += ' RETURNING *';
            }
            console.log('SQL:', sql, values); // Log for debugging on Render
            const res = await pool.query(sql, values);
            const data = this._countOnly ? [] : res.rows;
            const count = res.rowCount;
            if (this._single) {
                return resolve({ data: data[0] || null, error: null, count });
            }
            return resolve({ data, error: null, count });
        }
        catch (err) {
            console.error(`DB Error (${this.table}):`, err.message, err.detail);
            return resolve({ data: null, error: { message: err.message || 'Unknown database error', details: err.detail } });
        }
    }
}
/**
 * Mock implementation of Supabase Auth using local PostgreSQL auth_users table
 */
const auth = {
    signInWithPassword: async ({ email, password }) => {
        try {
            const { rows } = await pool.query('SELECT * FROM auth_users WHERE email = $1 AND password = $2', [email, password]);
            if (rows.length === 0)
                return { data: { user: null, session: null }, error: { message: 'Invalid credentials' } };
            const user = rows[0];
            const accessToken = jsonwebtoken_1.default.sign({ sub: user.id, email: user.email }, config_1.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
            return {
                data: {
                    user: { id: user.id, email: user.email },
                    session: { access_token: accessToken, refresh_token: 'local-refresh-token', expires_at: Math.floor(Date.now() / 1000) + 3600 }
                },
                error: null
            };
        }
        catch (err) {
            return { data: null, error: { message: err.message } };
        }
    },
    getUser: async (token) => {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.env.JWT_SECRET || 'secret');
            return { data: { user: { id: decoded.sub, email: decoded.email } }, error: null };
        }
        catch (err) {
            return { data: { user: null }, error: { message: 'Invalid token' } };
        }
    },
    refreshSession: async ({ refresh_token }) => {
        return {
            data: {
                session: {
                    access_token: 'new-local-token',
                    refresh_token: 'local-refresh-token',
                    expires_at: Math.floor(Date.now() / 1000) + 3600
                }
            },
            error: null
        };
    },
    admin: {
        createUser: async ({ email, password }) => {
            try {
                const { rows } = await pool.query('INSERT INTO auth_users (email, password) VALUES ($1, $2) RETURNING id, email', [email, password]);
                return { data: { user: rows[0] }, error: null };
            }
            catch (err) {
                return { data: null, error: { message: err.message } };
            }
        },
        deleteUser: async (id) => {
            await pool.query('DELETE FROM auth_users WHERE id = $1', [id]);
            return { data: null, error: null };
        },
        signOut: async (_token) => ({ data: null, error: null })
    }
};
exports.supabaseAdmin = {
    from: (table) => new PostgresQueryBuilder(table),
    auth,
    rpc: async (fn, params) => {
        if (fn === 'increment_slot_booking') {
            const { rows } = await pool.query('SELECT increment_slot_booking($1)', [params.p_slot_id]);
            return { data: rows[0].increment_slot_booking, error: null };
        }
        return { data: null, error: { message: `RPC ${fn} not implemented in shim` } };
    }
};
exports.supabasePublic = exports.supabaseAdmin;
function createSupabaseClient(token) {
    return exports.supabaseAdmin;
}
function isSupabaseConfigured() {
    return true;
}
//# sourceMappingURL=supabase.js.map