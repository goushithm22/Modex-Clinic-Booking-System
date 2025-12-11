"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetSlots = handleGetSlots;
exports.handleGetSlotById = handleGetSlotById;
exports.handleCreateBooking = handleCreateBooking;
exports.handleGetBookingById = handleGetBookingById;
exports.handleDeleteSlot = handleDeleteSlot;
/**
 * @file publicController.ts
 * @description Handlers for public-facing routes (slots listing and bookings).
 */
const slotModel_1 = require("../models/slotModel");
const validation_1 = require("../models/validation");
const slotModel_2 = require("../models/slotModel");
const bookingModel_1 = require("../models/bookingModel");
/**
 * Retrieves all available slots with doctor information and availability.
 *
 * @param {Request} _req Express request (unused).
 * @param {Response} res Express response used to send slot data.
 * @param {NextFunction} next Next middleware in the chain.
 * @returns {Promise<void>} Promise that resolves when the response is sent.
 */
async function handleGetSlots(_req, res, next) {
    try {
        const slots = await (0, slotModel_2.getAllSlotsWithMeta)();
        res.status(200).json({
            slots
        });
    }
    catch (error) {
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
async function handleGetSlotById(req, res, next) {
    try {
        const slotIdParam = req.params.slotId;
        if (slotIdParam === undefined || slotIdParam.trim().length === 0) {
            res.status(400).json({
                error: "slotId parameter is required."
            });
            return;
        }
        const slot = await (0, slotModel_2.getSlotWithMetaById)(slotIdParam);
        if (slot === null) {
            res.status(404).json({
                error: "Slot not found."
            });
            return;
        }
        res.status(200).json({
            slot
        });
    }
    catch (error) {
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
async function handleCreateBooking(req, res, next) {
    try {
        const parseResult = validation_1.createBookingSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: "Invalid booking payload.",
                details: parseResult.error.format()
            });
            return;
        }
        const data = parseResult.data;
        try {
            const booking = await (0, bookingModel_1.createBookingWithConcurrencyControl)(data.slotId, data.userName);
            res.status(201).json({
                booking
            });
        }
        catch (bookingError) {
            // Booking-related error, such as slot not found or full.
            const message = bookingError instanceof Error
                ? bookingError.message
                : "Unknown booking error.";
            if (message === "Slot not found.") {
                res.status(404).json({
                    error: message
                });
            }
            else if (message === "Slot is full.") {
                res.status(409).json({
                    error: message
                });
            }
            else {
                res.status(500).json({
                    error: message
                });
            }
        }
    }
    catch (error) {
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
async function handleGetBookingById(req, res, next) {
    try {
        const bookingIdParam = req.params.bookingId;
        if (bookingIdParam === undefined || bookingIdParam.trim().length === 0) {
            res.status(400).json({
                error: "bookingId parameter is required."
            });
            return;
        }
        const booking = await (0, bookingModel_1.getBookingById)(bookingIdParam);
        if (booking === null) {
            res.status(404).json({
                error: "Booking not found."
            });
            return;
        }
        res.status(200).json({
            booking
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * DELETE /api/slots/:slotId
 * Public endpoint to delete a slot if it has no confirmed bookings.
 */
async function handleDeleteSlot(req, res, next) {
    try {
        const slotId = req.params.slotId;
        if (!slotId || slotId.trim().length === 0) {
            res.status(400).json({ error: "Invalid slot id." });
            return;
        }
        await (0, slotModel_1.hardDeleteSlot)(slotId);
        res.status(200).json({ message: "Slot deleted." });
    }
    catch (error) {
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
