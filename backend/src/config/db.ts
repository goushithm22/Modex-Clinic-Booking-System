/**
 * @file db.ts
 * @description PostgreSQL connection pool and helper to run queries and transactions.
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
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
export function query<TRow extends QueryResultRow = any>(
  text: string,
  params: unknown[]
): Promise<QueryResult<TRow>> {
  return pool.query<TRow>(text, params);
}


/**
 * Runs a callback within a PostgreSQL transaction.
 * Automatically commits on success and rolls back on error.
 *
 * @template TReturn Return type of the callback.
 * @param {(client: PoolClient) => Promise<TReturn>} callback Logic to execute inside the transaction.
 * @returns {Promise<TReturn>} The callback result.
 */
export async function withTransaction<TReturn>(
  callback: (client: PoolClient) => Promise<TReturn>
): Promise<TReturn> {
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

export default pool;
