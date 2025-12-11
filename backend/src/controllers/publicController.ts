/**
 * @file publicController.ts
 * @description Handlers for public-facing routes (slots listing and bookings).
 */
import { hardDeleteSlot } from "../models/slotModel";
import { Request, Response, NextFunction } from "express";
import {
  createBookingSchema,
  CreateBookingInput
} from "../models/validation";
import {
  getAllSlotsWithMeta,
  getSlotWithMetaById
} from "../models/slotModel";
import {
  createBookingWithConcurrencyControl,
  getBookingById
} from "../models/bookingModel";

/**
 * Retrieves all available slots with doctor information and availability.
 *
 * @param {Request} _req Express request (unused).
 * @param {Response} res Express response used to send slot data.
 * @param {NextFunction} next Next middleware in the chain.
 * @returns {Promise<void>} Promise that resolves when the response is sent.
 */
export async function handleGetSlots(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const slots = await getAllSlotsWithMeta();
    res.status(200).json({
      slots
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves a specific slot with doctor information and availability.
 *
 * @param {Request} req Express request containing the slot identifier.
 * @param {Response} res Express response used to send slot data.
 * @param {NextFunction} next Next middleware in the chain.
 * @returns {Promise<void>} Promise that resolves when the response is sent.
 */
export async function handleGetSlotById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const slotIdParam = req.params.slotId;

    if (slotIdParam === undefined || slotIdParam.trim().length === 0) {
      res.status(400).json({
        error: "slotId parameter is required."
      });
      return;
    }

    const slot = await getSlotWithMetaById(slotIdParam);

    if (slot === null) {
      res.status(404).json({
        error: "Slot not found."
      });
      return;
    }

    res.status(200).json({
      slot
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Creates a booking with concurrency control to prevent overbooking.
 *
 * @param {Request} req Express request containing booking payload.
 * @param {Response} res Express response used to send booking data.
 * @param {NextFunction} next Next middleware in the chain.
 * @returns {Promise<void>} Promise that resolves when the response is sent.
 */
export async function handleCreateBooking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parseResult = createBookingSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        error: "Invalid booking payload.",
        details: parseResult.error.format()
      });
      return;
    }

    const data: CreateBookingInput = parseResult.data;

    try {
      const booking = await createBookingWithConcurrencyControl(
        data.slotId,
        data.userName
      );

      res.status(201).json({
        booking
      });
    } catch (bookingError) {
      // Booking-related error, such as slot not found or full.
      const message: string =
        bookingError instanceof Error
          ? bookingError.message
          : "Unknown booking error.";
      if (message === "Slot not found.") {
        res.status(404).json({
          error: message
        });
      } else if (message === "Slot is full.") {
        res.status(409).json({
          error: message
        });
      } else {
        res.status(500).json({
          error: message
        });
      }
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves a booking by its identifier.
 *
 * @param {Request} req Express request containing booking identifier.
 * @param {Response} res Express response used to send booking data.
 * @param {NextFunction} next Next middleware in the chain.
 * @returns {Promise<void>} Promise that resolves when the response is sent.
 */
export async function handleGetBookingById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const bookingIdParam = req.params.bookingId;

    if (bookingIdParam === undefined || bookingIdParam.trim().length === 0) {
      res.status(400).json({
        error: "bookingId parameter is required."
      });
      return;
    }

    const booking = await getBookingById(bookingIdParam);

    if (booking === null) {
      res.status(404).json({
        error: "Booking not found."
      });
      return;
    }

    res.status(200).json({
      booking
    });
  } catch (error) {
    next(error);
  }
}
/**
 * DELETE /api/slots/:slotId
 * Public endpoint to delete a slot if it has no confirmed bookings.
 */
export async function handleDeleteSlot(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const slotId = req.params.slotId;
    if (!slotId || slotId.trim().length === 0) {
      res.status(400).json({ error: "Invalid slot id." });
      return;
    }

    await hardDeleteSlot(slotId);

    res.status(200).json({ message: "Slot deleted." });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in handleDeleteSlot:", error);
    if (error instanceof Error && error.message === "Slot has confirmed bookings and cannot be deleted.") {
      res.status(403).json({ error: error.message });
      return;
    }
    if (error instanceof Error && error.message === "Slot not found.") {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
}
