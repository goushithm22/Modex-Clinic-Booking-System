/**
 * @file env.ts
 * @description Loads environment variables and exposes strongly typed configuration.
 */

import dotenv from "dotenv";

dotenv.config();

/**
 * Application configuration derived from environment variables.
 */
export interface AppConfig {
  readonly port: number;
  readonly databaseUrl: string;
}

/**
 * Reads and validates environment variables at startup.
 * Throws an error if required values are missing or invalid.
 *
 * @returns {AppConfig} Validated application configuration.
 */
export function loadConfig(): AppConfig {
  const portRaw: string | undefined = process.env.PORT;
  const databaseUrl: string | undefined = process.env.DATABASE_URL;

  if (portRaw === undefined) {
    throw new Error("PORT environment variable is required.");
  }

  const parsedPort: number = Number(portRaw);
  if (Number.isNaN(parsedPort) || parsedPort <= 0) {
    throw new Error("PORT must be a positive integer.");
  }

  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    throw new Error("DATABASE_URL environment variable is required.");
  }

  return {
    port: parsedPort,
    databaseUrl
  };
}
