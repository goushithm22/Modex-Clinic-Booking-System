"use strict";
/**
 * @file errorHandler.ts
 * @description Centralized Express error-handling middleware.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
/**
 * Express error-handling middleware.
 * Logs the error and returns a generic response to the client.
 *
 * @param {unknown} err Error thrown in the request pipeline.
 * @param {Request} _req Express request object (unused).
 * @param {Response} res Express response used to send error details.
 * @param {NextFunction} _next Next middleware (unused, required by signature).
 */
function errorHandler(err, _req, res, _next) {
    // Always log the full stack if available so Render logs show root cause.
    if (err instanceof Error) {
        console.error("Unhandled error:", err.stack ?? err.message);
    }
    else {
        console.error("Unhandled error (non-Error):", JSON.stringify(err));
    }
    // Do not leak internals to public; return a small message but include message in details in non-production if desired.
    const isProd = process.env.NODE_ENV === "production";
    res.status(500).json({
        error: "Internal server error.",
        // Include a short message in details only when not in production (helps diagnosis); otherwise empty string.
        details: isProd ? "" : err instanceof Error ? err.message : ""
    });
}
