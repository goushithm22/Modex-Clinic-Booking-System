/**
 * @file cors.ts
 * @description CORS middleware that supports a comma-separated list of allowed origins
 *              provided via the CORS_ORIGINS environment variable.
 *
 * Example env:
 *   CORS_ORIGINS="https://modex-clinic-booking-system.vercel.app,https://my-preview.vercel.app,http://localhost:5173"
 */

import cors from "cors";
import express from "express";

const DEFAULT_ORIGINS = "http://localhost:5173";

/**
 * Build and return the CORS middleware configured from env.
 */
export default function createCorsMiddleware(): express.RequestHandler {
  const raw = process.env.CORS_ORIGINS ?? DEFAULT_ORIGINS;
  const allowed = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const options: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server, Postman)
      if (!origin) return callback(null, true);

      // If wildcard specified, allow everything
      if (allowed.includes("*")) {
        return callback(null, true);
      }

      if (allowed.includes(origin)) {
        return callback(null, true);
      }

      // disallowed origin
      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Origin", "Accept"],
    preflightContinue: false,
    optionsSuccessStatus: 204
  };

  return cors(options);
}
