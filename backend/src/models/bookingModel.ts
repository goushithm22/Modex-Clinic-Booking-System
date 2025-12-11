/**
 * @file bookingModel.ts
 * @description Data access methods for booking entities, including concurrency-safe creation.
 */

import { PoolClient, QueryResult } from "pg";
import { withTransaction } from "../config/db";
import { Booking, BookingStatus } from "./types";
import { lockSlotForUpdate } from "./slotModel";
import { generateUuid } from "../utils/uuid";

/**
 * Inserts a booking record within an existing transaction.
 *
 * @param {PoolClient} client PostgreSQL client inside a transaction.
 * @param {string} slotId Identifier of the slot being booked.
 * @param {string} userName Name of the user creating the booking.
 * @param {BookingStatus} status Booking status to be stored.
 * @returns {Promise<Booking>} Created booking record.
 */
async function insertBookingInTransaction(
  client: PoolClient,
  slotId: string,
  userName: string,
  status: BookingStatus
): Promise<Booking> {
  const id: string = generateUuid();

  const result: QueryResult<{
    id: string;
    slot_id: string;
    user_name: string;
    status: BookingStatus;
    created_at: string;
    updated_at: string;
  }> = await client.query(
    `
    INSERT INTO bookings (id, slot_id, user_name, status)
    VALUES ($1, $2, $3, $4)
    RETURNING id, slot_id, user_name, status, created_at, updated_at
    `,
    [id, slotId, userName, status]
  );

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
async function countConfirmedBookingsInTransaction(
  client: PoolClient,
  slotId: string
): Promise<number> {
  const result: QueryResult<{ confirmed_count: number }> = await client.query(
    `
    SELECT COUNT(*)::int AS confirmed_count
    FROM bookings
    WHERE slot_id = $1 AND status = 'CONFIRMED'
    `,
    [slotId]
  );

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
export async function createBookingWithConcurrencyControl(
  slotId: string,
  userName: string
): Promise<Booking> {
  return withTransaction<Booking>(async (client: PoolClient): Promise<Booking> => {
    const lockedSlot = await lockSlotForUpdate(client, slotId);

    if (lockedSlot === null) {
      throw new Error("Slot not found.");
    }

    const confirmedCount: number = await countConfirmedBookingsInTransaction(
      client,
      slotId
    );

    if (confirmedCount >= lockedSlot.capacity) {
      throw new Error("Slot is full.");
    }

    const booking: Booking = await insertBookingInTransaction(
      client,
      slotId,
      userName,
      "CONFIRMED"
    );

    return booking;
  });
}

/**
 * Retrieves a booking by its identifier.
 *
 * @param {string} bookingId Booking identifier.
 * @returns {Promise<Booking | null>} Booking if found, otherwise null.
 */
export async function getBookingById(
  bookingId: string
): Promise<Booking | null> {
  const result: QueryResult<{
    id: string;
    slot_id: string;
    user_name: string;
    status: BookingStatus;
    created_at: string;
    updated_at: string;
  }> = await import("../config/db").then((module) =>
    module.query(
      `
      SELECT id, slot_id, user_name, status, created_at, updated_at
      FROM bookings
      WHERE id = $1
      `,
      [bookingId]
    )
  );

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
