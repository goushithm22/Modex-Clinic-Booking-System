/**
 * @file errorHandler.ts
 * @description Centralized Express error-handling middleware.
 */

import { Request, Response, NextFunction } from "express";

/**
 * Express error-handling middleware.
 * Logs the error and returns a generic response to the client.
 *
 * @param {unknown} err Error thrown in the request pipeline.
 * @param {Request} _req Express request object (unused).
 * @param {Response} res Express response used to send error details.
 * @param {NextFunction} _next Next middleware (unused, required by signature).
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const message: string =
    err instanceof Error ? err.message : "Unknown server error.";

  // In real production, hook this into a logger instead of console.log.
  // Here, we log for visibility during development and debugging.
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", message);

  res.status(500).json({
    error: "Internal server error.",
    details: message
  });
}
