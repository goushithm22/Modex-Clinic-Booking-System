"use strict";
/**
 * @file bookingModel.ts
 * @description Data access methods for booking entities, including concurrency-safe creation.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBookingWithConcurrencyControl = createBookingWithConcurrencyControl;
exports.getBookingById = getBookingById;
const db_1 = require("../config/db");
const slotModel_1 = require("./slotModel");
const uuid_1 = require("../utils/uuid");
/**
 * Inserts a booking record within an existing transaction.
 *
 * @param {PoolClient} client PostgreSQL client inside a transaction.
 * @param {string} slotId Identifier of the slot being booked.
 * @param {string} userName Name of the user creating the booking.
 * @param {BookingStatus} status Booking status to be stored.
 * @returns {Promise<Booking>} Created booking record.
 */
async function insertBookingInTransaction(client, slotId, userName, status) {
    const id = (0, uuid_1.generateUuid)();
    const result = await client.query(`
    INSERT INTO bookings (id, slot_id, user_name, status)
    VALUES ($1, $2, $3, $4)
    RETURNING id, slot_id, user_name, status, created_at, updated_at
    `, [id, slotId, userName, status]);
    const row = result.rows[0];
    return {
        id: row.id,
        slotId: row.slot_id,
        userName: row.user_name,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}
/**
 * Counts the number of confirmed bookings for a slot
 * inside an existing transaction.
 *
 * @param {PoolClient} client PostgreSQL client inside a transaction.
 * @param {string} slotId Slot identifier.
 * @returns {Promise<number>} Number of confirmed bookings.
 */
async function countConfirmedBookingsInTransaction(client, slotId) {
    const result = await client.query(`
    SELECT COUNT(*)::int AS confirmed_count
    FROM bookings
    WHERE slot_id = $1 AND status = 'CONFIRMED'
    `, [slotId]);
    const row = result.rows[0];
    return row.confirmed_count;
}
/**
 * Creates a booking using a database transaction and row-level locking
 * to ensure that a slot is never overbooked.
 *
 * @param {string} slotId Identifier of the slot being booked.
 * @param {string} userName Name of the user creating the booking.
 * @returns {Promise<Booking>} Created booking record.
 * @throws {Error} If the slot does not exist or has no remaining capacity.
 */
async function createBookingWithConcurrencyControl(slotId, userName) {
    return (0, db_1.withTransaction)(async (client) => {
        const lockedSlot = await (0, slotModel_1.lockSlotForUpdate)(client, slotId);
        if (lockedSlot === null) {
            throw new Error("Slot not found.");
        }
        const confirmedCount = await countConfirmedBookingsInTransaction(client, slotId);
        if (confirmedCount >= lockedSlot.capacity) {
            throw new Error("Slot is full.");
        }
        const booking = await insertBookingInTransaction(client, slotId, userName, "CONFIRMED");
        return booking;
    });
}
/**
 * Retrieves a booking by its identifier.
 *
 * @param {string} bookingId Booking identifier.
 * @returns {Promise<Booking | null>} Booking if found, otherwise null.
 */
async function getBookingById(bookingId) {
    const result = await Promise.resolve().then(() => __importStar(require("../config/db"))).then((module) => module.query(`
      SELECT id, slot_id, user_name, status, created_at, updated_at
      FROM bookings
      WHERE id = $1
      `, [bookingId]));
    if (result.rowCount === 0) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row.id,
        slotId: row.slot_id,
        userName: row.user_name,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}
