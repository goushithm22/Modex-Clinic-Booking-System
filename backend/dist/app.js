"use strict";
/**
 * @file app.ts
 * @description Configures and exports the Express application.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const publicRoutes_1 = __importDefault(require("./routes/publicRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
/**
 * Creates and configures the Express application.
 *
 * @returns {Application} Configured Express app instance.
 */
function createApp() {
    const app = (0, express_1.default)();
    /**
     * Configure CORS so that the frontend at http://localhost:5173
     * is allowed to call this API during development.
     */
    app.use((0, cors_1.default)({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    }));
    // Parse JSON bodies.
    app.use(express_1.default.json());
    // Health check endpoint.
    app.get("/health", (_req, res) => {
        res.status(200).json({
            status: "ok"
        });
    });
    // Admin routes under /api/admin
    app.use("/api/admin", adminRoutes_1.default);
    // Public routes under /api
    app.use("/api", publicRoutes_1.default);
    // Central error handler (must be last).
    app.use(errorHandler_1.errorHandler);
    return app;
}
