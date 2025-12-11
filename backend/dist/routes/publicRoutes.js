"use strict";
/**
 * @file publicRoutes.ts
 * @description Express router for public operations.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const publicController_1 = require("../controllers/publicController");
const adminRoutes_1 = __importDefault(require("./adminRoutes"));
const publicRouter = (0, express_1.Router)();
/**
 * GET /api/slots
 */
publicRouter.get("/slots", publicController_1.handleGetSlots);
/**
 * GET /api/slots/:slotId
 */
publicRouter.get("/slots/:slotId", publicController_1.handleGetSlotById);
/**
 * POST /api/bookings
 * Body: { slotId, userName }
 */
publicRouter.post("/bookings", publicController_1.handleCreateBooking);
/**
 * GET /api/bookings/:bookingId
 */
publicRouter.get("/bookings/:bookingId", publicController_1.handleGetBookingById);
// Delete a slot if safe (public)
adminRoutes_1.default.delete("/slots/:slotId", publicController_1.handleDeleteSlot);
exports.default = publicRouter;
