"use strict";
/**
 * @file env.ts
 * @description Loads environment variables and exposes strongly typed configuration.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Reads and validates environment variables at startup.
 * Throws an error if required values are missing or invalid.
 *
 * @returns {AppConfig} Validated application configuration.
 */
function loadConfig() {
    const portRaw = process.env.PORT;
    const databaseUrl = process.env.DATABASE_URL;
    if (portRaw === undefined) {
        throw new Error("PORT environment variable is required.");
    }
    const parsedPort = Number(portRaw);
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
