/**
 * @file publicRoutes.ts
 * @description Express router for public operations.
 */

import { Router } from "express";
import {
  handleGetSlots,
  handleGetSlotById,
  handleCreateBooking,
  handleGetBookingById,
  handleDeleteSlot
} from "../controllers/publicController";
import router from "./adminRoutes";

const publicRouter: Router = Router();

/**
 * GET /api/slots
 */
publicRouter.get("/slots", handleGetSlots);

/**
 * GET /api/slots/:slotId
 */
publicRouter.get("/slots/:slotId", handleGetSlotById);

/**
 * POST /api/bookings
 * Body: { slotId, userName }
 */
publicRouter.post("/bookings", handleCreateBooking);

/**
 * GET /api/bookings/:bookingId
 */
publicRouter.get("/bookings/:bookingId", handleGetBookingById);

// Delete a slot if safe (public)
router.delete("/slots/:slotId", handleDeleteSlot);


export default publicRouter;
