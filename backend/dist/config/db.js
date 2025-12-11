"use strict";
/**
 * @file db.ts
 * @description PostgreSQL connection pool and helper to run queries and transactions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
exports.withTransaction = withTransaction;
const pg_1 = require("pg");
const env_1 = require("./env");
const config = (0, env_1.loadConfig)();
/**
 * Shared PostgreSQL connection pool.
 */
const pool = new pg_1.Pool({
    connectionString: config.databaseUrl
});
/**
 * Executes a single SQL query using the shared connection pool.
 *
 * @template TRow Row type for the query result.
 * @param {string} text SQL query text.
 * @param {readonly unknown[]} params Parameter values.
 * @returns {Promise<QueryResult<TRow>>} Query result promise.
 */
function query(text, params) {
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
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
exports.default = pool;
