/**
 * A lightweight shim that mimics the Supabase query builder (postgrest-js)
 * but executes raw SQL against a local PostgreSQL database.
 */
declare class PostgresQueryBuilder {
    private table;
    private _select;
    private _filters;
    private _type;
    private _payload;
    private _single;
    private _order;
    private _limit;
    private _offset;
    private _countOnly;
    private _joins;
    private _group;
    constructor(table: string);
    select(columns?: string, options?: {
        count?: string;
        head?: boolean;
    }): this;
    insert(payload: any): this;
    update(payload: any): this;
    delete(): this;
    eq(col: string, val: any): this;
    neq(col: string, val: any): this;
    gt(col: string, val: any): this;
    gte(col: string, val: any): this;
    lt(col: string, val: any): this;
    lte(col: string, val: any): this;
    in(col: string, vals: any[]): this;
    is(col: string, val: any): this;
    or(filter: string): this;
    ilike(col: string, val: any): this;
    match(obj: Record<string, any>): this;
    order(col: string, options?: {
        ascending: boolean;
    }): this;
    limit(n: number, options?: any): this;
    range(from: number, to: number): this;
    single(): this;
    then(resolve: (value: any) => void, reject: (reason?: any) => void): Promise<void>;
}
export declare const supabaseAdmin: {
    from: (table: string) => PostgresQueryBuilder;
    auth: {
        signInWithPassword: ({ email, password }: any) => Promise<{
            data: {
                user: null;
                session: null;
            };
            error: {
                message: string;
            };
        } | {
            data: {
                user: {
                    id: any;
                    email: any;
                };
                session: {
                    access_token: string;
                    refresh_token: string;
                    expires_at: number;
                };
            };
            error: null;
        } | {
            data: null;
            error: {
                message: any;
            };
        }>;
        getUser: (token: string) => Promise<{
            data: {
                user: {
                    id: any;
                    email: any;
                };
            };
            error: null;
        } | {
            data: {
                user: null;
            };
            error: {
                message: string;
            };
        }>;
        refreshSession: ({ refresh_token }: any) => Promise<{
            data: {
                session: {
                    access_token: string;
                    refresh_token: string;
                    expires_at: number;
                };
            };
            error: null;
        }>;
        admin: {
            createUser: ({ email, password }: any) => Promise<{
                data: {
                    user: any;
                };
                error: null;
            } | {
                data: null;
                error: {
                    message: any;
                };
            }>;
            deleteUser: (id: string) => Promise<{
                data: null;
                error: null;
            }>;
            signOut: (_token?: string) => Promise<{
                data: null;
                error: null;
            }>;
        };
    };
    rpc: (fn: string, params: any) => Promise<{
        data: any;
        error: null;
    } | {
        data: null;
        error: {
            message: string;
        };
    }>;
};
export declare const supabasePublic: {
    from: (table: string) => PostgresQueryBuilder;
    auth: {
        signInWithPassword: ({ email, password }: any) => Promise<{
            data: {
                user: null;
                session: null;
            };
            error: {
                message: string;
            };
        } | {
            data: {
                user: {
                    id: any;
                    email: any;
                };
                session: {
                    access_token: string;
                    refresh_token: string;
                    expires_at: number;
                };
            };
            error: null;
        } | {
            data: null;
            error: {
                message: any;
            };
        }>;
        getUser: (token: string) => Promise<{
            data: {
                user: {
                    id: any;
                    email: any;
                };
            };
            error: null;
        } | {
            data: {
                user: null;
            };
            error: {
                message: string;
            };
        }>;
        refreshSession: ({ refresh_token }: any) => Promise<{
            data: {
                session: {
                    access_token: string;
                    refresh_token: string;
                    expires_at: number;
                };
            };
            error: null;
        }>;
        admin: {
            createUser: ({ email, password }: any) => Promise<{
                data: {
                    user: any;
                };
                error: null;
            } | {
                data: null;
                error: {
                    message: any;
                };
            }>;
            deleteUser: (id: string) => Promise<{
                data: null;
                error: null;
            }>;
            signOut: (_token?: string) => Promise<{
                data: null;
                error: null;
            }>;
        };
    };
    rpc: (fn: string, params: any) => Promise<{
        data: any;
        error: null;
    } | {
        data: null;
        error: {
            message: string;
        };
    }>;
};
export declare function createSupabaseClient(token: string): {
    from: (table: string) => PostgresQueryBuilder;
    auth: {
        signInWithPassword: ({ email, password }: any) => Promise<{
            data: {
                user: null;
                session: null;
            };
            error: {
                message: string;
            };
        } | {
            data: {
                user: {
                    id: any;
                    email: any;
                };
                session: {
                    access_token: string;
                    refresh_token: string;
                    expires_at: number;
                };
            };
            error: null;
        } | {
            data: null;
            error: {
                message: any;
            };
        }>;
        getUser: (token: string) => Promise<{
            data: {
                user: {
                    id: any;
                    email: any;
                };
            };
            error: null;
        } | {
            data: {
                user: null;
            };
            error: {
                message: string;
            };
        }>;
        refreshSession: ({ refresh_token }: any) => Promise<{
            data: {
                session: {
                    access_token: string;
                    refresh_token: string;
                    expires_at: number;
                };
            };
            error: null;
        }>;
        admin: {
            createUser: ({ email, password }: any) => Promise<{
                data: {
                    user: any;
                };
                error: null;
            } | {
                data: null;
                error: {
                    message: any;
                };
            }>;
            deleteUser: (id: string) => Promise<{
                data: null;
                error: null;
            }>;
            signOut: (_token?: string) => Promise<{
                data: null;
                error: null;
            }>;
        };
    };
    rpc: (fn: string, params: any) => Promise<{
        data: any;
        error: null;
    } | {
        data: null;
        error: {
            message: string;
        };
    }>;
};
export declare function isSupabaseConfigured(): boolean;
export {};
//# sourceMappingURL=supabase.d.ts.map