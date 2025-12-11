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



  return app;
}
