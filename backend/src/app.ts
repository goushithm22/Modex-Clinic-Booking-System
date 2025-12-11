/**
 * @file app.ts
 * @description Configures and exports the Express application.
 */

import express, { Application } from "express";
import cors from "cors";
import adminRouter from "./routes/adminRoutes";
import publicRouter from "./routes/publicRoutes";
import { errorHandler } from "./middleware/errorHandler";

/**
 * Creates and configures the Express application.
 *
 * @returns {Application} Configured Express app instance.
 */
export function createApp(): Application {
  const app: Application = express();
  app.use(cors({ origin: "https://modex-clinic-booking-system-git-main-goushithm22s-projects.vercel.app", credentials: true }));



  /**
   * Configure CORS so that the frontend at http://localhost:5173
   * is allowed to call this API during development.
   */
  app.use(
    cors({
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    })
  );

  // Parse JSON bodies.
  app.use(express.json());

  // Health check endpoint.
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok"
    });
  });

  // Admin routes under /api/admin
  app.use("/api/admin", adminRouter);

  // Public routes under /api
  app.use("/api", publicRouter);

  // Central error handler (must be last).
  app.use(errorHandler);



/**
 * Build an allowed-origins list from the environment.
 * Set CORS_ORIGINS in Render to something like:
 *   https://modex-clinic-booking-system.onrender.com,https://your-vercel-app.vercel.app,http://localhost:5173
 */
const rawOrigins = process.env.CORS_ORIGINS ?? "";
const allowedOrigins: string[] = rawOrigins
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * CORS options that validate incoming origin against allowedOrigins.
 * - If no origin is present (curl/postman/server-to-server), allow it.
 * - If origin is in allowedOrigins, allow it and echo it in Access-Control-Allow-Origin.
 * - Otherwise reject with an error (CORS middleware will block the request).
 */
app.use(
  cors({
    origin: (incomingOrigin, callback) => {
      // Allow server-to-server requests where origin is not set
      if (!incomingOrigin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(incomingOrigin)) {
        // accept this origin
        return callback(null, true);
      }

      // deny other origins (helpful for debugging)
      console.warn(
        `CORS denied: origin "${incomingOrigin}" not in allowed list: ${JSON.stringify(
          allowedOrigins
        )}`
      );
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true, // set to true if frontend needs cookies/auth
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
  })
);

// Optional: ensure preflight responses are handled for all routes
app.options("*", cors());


  return app;
}
