// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";

/**
 * Central error handler that logs full error details to help diagnose
 * production-only failures. This is intentionally verbose — revert to
 * concise logging after you debug the issue.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Build a safe serializable object for logging (avoid circular JSON)
  const safeError: Record<string, unknown> = {};

  // If it's an Error, grab message + stack
  if (err && typeof err === "object" && "message" in (err as any)) {
    safeError.message = (err as any).message;
    safeError.stack = (err as any).stack;
  } else {
    // non-Error thrown (string / undefined / other), capture raw
    safeError.raw = err;
  }

  // Add request context (method/url/headers) to logs to help reproduce
  const reqContext = {
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    query: req.query,
    // do NOT log entire headers/body in production; log only relevant info
    headers: {
      origin: req.headers.origin,
      host: req.headers.host,
      "user-agent": req.headers["user-agent"]
    }
  };

  // Full debug object
  const debugObj = {
    when: new Date().toISOString(),
    error: safeError,
    request: reqContext
  };

  // Print to stderr (Render / Heroku / most PaaS will capture this)
  // Use console.error so logs are highlighted as errors in the platform UI.
  console.error("🔥 UNHANDLED ERROR DEBUG DUMP:", JSON.stringify(debugObj, null, 2));

  // Also keep a short error response for the client
  try {
    res.status(500).json({
      error: "Internal server error.",
      // include a short hint only (do not leak stack to public).
      details: safeError.message ?? "no message"
    });
  } catch (e) {
    // In case response writing fails, ensure the process doesn't crash silently
    console.error("Error while sending error response:", e);
  }
}
