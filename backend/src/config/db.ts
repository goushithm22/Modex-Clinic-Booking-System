/**
 * @file db.ts
 * @description PostgreSQL connection pool and helper to run queries and transactions.
 */

import { Pool, PoolClient, QueryResult } from "pg";
import { loadConfig } from "./env";

const config = loadConfig();

/**
 * Shared PostgreSQL connection pool.
 */
const pool: Pool = new Pool({
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
export function query<TRow>(text: string, params: readonly unknown[] = []): Promise<QueryResult<TRow>> {
  // pool.query's param type is mutable any[], but callers may pass readonly arrays.
  // Casting here is a minimal, safe conversion at the boundary.
  return pool.query<TRow>(text, params as unknown as any[]);
}

/**
 * Runs a callback within a PostgreSQL transaction.
 * Automatically commits on success and rolls back on error.
 *
 * @template TReturn Return type of the callback.
 * @param {(client: PoolClient) => Promise<TReturn>} callback Logic to execute inside the transaction.
 * @returns {Promise<TReturn>} The callback result.
 */
export async function withTransaction<TReturn>(callback: (client: PoolClient) => Promise<TReturn>): Promise<TReturn> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");
    const result: TReturn = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Export pool as the default export to support modules that do:
// import pool from "../config/db";
export default pool;
