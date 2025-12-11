/**
 * @file app.ts
 * @description Configures and exports the Express application.
 *
 * - Uses CORS_ORIGINS (comma-separated) to allow multiple origins in production.
 * - CORS middleware is applied once (before routes) and will echo the request origin when allowed.
 * - Supports requests with no Origin (curl / server-to-server).
 */

import express, { Application, RequestHandler } from "express";
import cors, { CorsOptions } from "cors";
import adminRouter from "./routes/adminRoutes";
import publicRouter from "./routes/publicRoutes";
import { errorHandler } from "./middleware/errorHandler";

/**
 * Parse CORS_ORIGINS env var into an allowed-origins list.
 * Example:
 *   CORS_ORIGINS="https://app.vercel.app,https://preview-app.vercel.app,http://localhost:5173"
 */
function buildCorsOptions(): CorsOptions {
  const raw = process.env.CORS_ORIGINS ?? "";
  const allowedOrigins = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // If no origins configured, default to allowing localhost:5173 for dev convenience.
  if (allowedOrigins.length === 0) {
    allowedOrigins.push("http://localhost:5173");
  }

  const options: CorsOptions = {
    origin: (incomingOrigin, callback) => {
      // No origin (curl, Postman, server-to-server) -> allow
      if (!incomingOrigin) {
        return callback(null, true);
      }

      // wildcard present -> allow all origins (use with caution)
      if (allowedOrigins.includes("*")) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(incomingOrigin)) {
        // Allowed origin -> allow and echo the origin header
        return callback(null, true);
      }

      // Not allowed
      // Log for debugging (Render logs)
      // eslint-disable-next-line no-console
      console.warn(
        `CORS blocked origin "${incomingOrigin}". Allowed: ${JSON.stringify(
          allowedOrigins
        )}`
      );
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Origin", "Accept"],
    preflightContinue: false,
    optionsSuccessStatus: 204
  };

  return options;
}

/**
 * Creates and configures the Express application.
 *
 * @returns {Application} Configured Express app instance.
 */
export function createApp(): Application {
  const app: Application = express();

  // Parse JSON bodies (before routes)
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Build and use the single CORS middleware (applied before routes)
  const corsOptions = buildCorsOptions();
  const corsMiddleware: RequestHandler = cors(corsOptions);
  app.use(corsMiddleware);

  // Ensure preflight (OPTIONS) is handled for all routes
  app.options("*", corsMiddleware);

  // Health check endpoint.
  // Keep this route accessible (no auth).
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Mount API routers
  // Admin routes under /api/admin
  app.use("/api/admin", adminRouter);

  // Public routes under /api
  app.use("/api", publicRouter);

  // Central error handler (must be last)
  app.use(errorHandler);

  return app;
}

export default createApp;
