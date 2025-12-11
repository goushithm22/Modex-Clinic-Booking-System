"use strict";
/**
 * @file src/config/db.ts
 * @description PostgreSQL connection pool and small helper wrappers for queries
 *              and transactions. This file exports:
 *                - named exports: query, withTransaction
 *                - default export: pool (pg Pool instance)
 *
 * Notes:
 * - The generic TRow is constrained to QueryResultRow to satisfy pg typings.
 * - We perform a minimal cast at the boundary when calling pool.query to accept
 *   readonly arrays from callers while satisfying the pg API which expects a
 *   mutable any[] - the cast is contained to this module.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
exports.withTransaction = withTransaction;
const pg_1 = require("pg");
const env_1 = require("./env");
const config = (0, env_1.loadConfig)();
// Basic runtime validation for required config value.
if (!config.databaseUrl || config.databaseUrl.trim().length === 0) {
    throw new Error("DATABASE_URL (config.databaseUrl) is required.");
}
/**
 * Shared PostgreSQL connection pool.
 */
const pool = new pg_1.Pool({
    connectionString: config.databaseUrl
});
/**
 * Executes a single SQL query using the shared connection pool.
 *
 * @template TRow Row type for the query result; constrained to QueryResultRow so
 *                 TypeScript knows it's a valid row type for pg.
 * @param {string} text SQL query text.
 * @param {readonly unknown[]} params Parameter values (readonly allowed).
 * @returns {Promise<QueryResult<TRow>>} Query result promise.
 */
function query(text, params = []) {
    if (typeof text !== "string" || text.trim().length === 0) {
        return Promise.reject(new Error("SQL query text must be a non-empty string."));
    }
    // pool.query expects a mutable any[] for values. Callers may pass readonly arrays
    // so we do a minimal cast at the boundary. This cast is intentionally local to
    // this module to avoid leaking 'any' throughout the codebase.
    return pool.query(text, params);
}
/**
 * Runs a callback within a PostgreSQL transaction.
 * Automatically commits on success and rolls back on error.
 *
 * @template TReturn Return type of the callback.
 * @param {(client: PoolClient) => Promise<TReturn>} callback Logic to execute inside the transaction.
 * @returns {Promise<TReturn>} The callback result.
 */
async function withTransaction(callback) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    }
    catch (error) {
        try {
            await client.query("ROLLBACK");
        }
        catch (rollbackErr) {
            // Log rollback failure but prefer to rethrow original error
            console.error("Rollback failed:", rollbackErr);
        }
        throw error;
    }
    finally {
        client.release();
    }
}
/**
 * Export pool as default so existing modules that import a default 'pool'
 * (e.g. `import pool from "../config/db"`) will receive the Pool instance.
 */
exports.default = pool;
