/**
 * @file slotModel.ts
 * @description Data access methods for slot entities.
 */

import { PoolClient, QueryResult } from "pg";
import { query } from "../config/db";
import { Slot, SlotWithMeta } from "./types";
import { generateUuid } from "../utils/uuid";

/**
 * Inserts a new slot into the database.
 *
 * @param {string} doctorId Associated doctor identifier.
 * @param {string} startTime ISO string representing the start of the slot.
 * @param {string} endTime ISO string representing the end of the slot.
 * @param {number} capacity Maximum number of bookings allowed.
 * @returns {Promise<Slot>} Created slot record.
 */
export async function createSlot(
  doctorId: string,
  startTime: string,
  endTime: string,
  capacity: number
): Promise<Slot> {
  const id: string = generateUuid();

  const result: QueryResult<{
    id: string;
    doctor_id: string;
    start_time: string;
    end_time: string;
    capacity: number;
    created_at: string;
  }> = await query(
    `
    INSERT INTO slots (id, doctor_id, start_time, end_time, capacity)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, doctor_id, start_time, end_time, capacity, created_at
    `,
    [id, doctorId, startTime, endTime, capacity]
  );

  const row = result.rows[0];

  return {
    id: row.id,
    doctorId: row.doctor_id,
    startTime: row.start_time,
    endTime: row.end_time,
    capacity: row.capacity,
    createdAt: row.created_at
  };
}

/**
 * Retrieves all upcoming slots with doctor information and availability.
 *
 * @returns {Promise<SlotWithMeta[]>} List of slots with meta information.
 */
export async function getAllSlotsWithMeta(): Promise<SlotWithMeta[]> {
  const result: QueryResult<any> = await query(
    `
    SELECT
      s.id,
      s.doctor_id,
      s.start_time,
      s.end_time,
      s.capacity,
      s.created_at,
      d.name AS doctor_name,
      d.specialization AS doctor_specialization,
      COALESCE((
        SELECT COUNT(*)
        FROM bookings b
        WHERE b.slot_id = s.id AND b.status = 'CONFIRMED'
      ), 0) AS confirmed_count,
      (
        SELECT json_agg(json_build_object('id', b.id, 'userName', b.user_name, 'status', b.status, 'createdAt', b.created_at))
        FROM bookings b
        WHERE b.slot_id = s.id AND b.status = 'CONFIRMED'
      ) AS bookings
    FROM slots s
    INNER JOIN doctors d ON d.id = s.doctor_id
    WHERE s.is_active IS NOT FALSE
    ORDER BY s.start_time ASC
    `,
    []
  );

  return result.rows.map(
    (row): SlotWithMeta => {
      const confirmedCount: number = Number(row.confirmed_count ?? 0);
      const availableSeats: number = row.capacity - confirmedCount;
      const bookings: { id: string; userName: string; status: string; createdAt: string }[] =
        (row.bookings as any[]) ?? [];

      return {
        id: row.id,
        doctorId: row.doctor_id,
        startTime: row.start_time,
        endTime: row.end_time,
        capacity: row.capacity,
        createdAt: row.created_at,
        doctorName: row.doctor_name,
        doctorSpecialization: row.doctor_specialization,
        confirmedCount,
        availableSeats,
        bookings
      };
    }
  );
}

/**
 * Retrieves a single slot with aggregated meta information.
 *
 * @param {string} slotId Slot identifier.
 * @returns {Promise<SlotWithMeta | null>} Slot with meta information, or null if not found.
 */
export async function getSlotWithMetaById(
  slotId: string
): Promise<SlotWithMeta | null> {
  const result: QueryResult<any> = await query(
    `
    SELECT
      s.id,
      s.doctor_id,
      s.start_time,
      s.end_time,
      s.capacity,
      s.created_at,
      d.name AS doctor_name,
      d.specialization AS doctor_specialization,
      COALESCE((
        SELECT COUNT(*)
        FROM bookings b
        WHERE b.slot_id = s.id AND b.status = 'CONFIRMED'
      ), 0) AS confirmed_count,
      (
        SELECT json_agg(json_build_object('id', b.id, 'userName', b.user_name, 'status', b.status, 'createdAt', b.created_at))
        FROM bookings b
        WHERE b.slot_id = s.id AND b.status = 'CONFIRMED'
      ) AS bookings
    FROM slots s
    INNER JOIN doctors d ON d.id = s.doctor_id
    WHERE s.id = $1
      AND s.is_active IS NOT FALSE
    `,
    [slotId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  const confirmedCount: number = Number(row.confirmed_count ?? 0);
  const availableSeats: number = row.capacity - confirmedCount;
  const bookings: { id: string; userName: string; status: string; createdAt: string }[] =
    (row.bookings as any[]) ?? [];

  return {
    id: row.id,
    doctorId: row.doctor_id,
    startTime: row.start_time,
    endTime: row.end_time,
    capacity: row.capacity,
    createdAt: row.created_at,
    doctorName: row.doctor_name,
    doctorSpecialization: row.doctor_specialization,
    confirmedCount,
    availableSeats,
    bookings
  };
}

/**
 * Locks a slot row for update within an existing transaction.
 * Used for concurrency-safe booking logic.
 *
 * @param {PoolClient} client PostgreSQL client inside a transaction.
 * @param {string} slotId Slot identifier.
 * @returns {Promise<{
 *   id: string;
 *   capacity: number;
 * } | null>} Slot basic info or null if not found.
 */
export async function lockSlotForUpdate(
  client: PoolClient,
  slotId: string
): Promise<{ id: string; capacity: number } | null> {
  const result: QueryResult<{
    id: string;
    capacity: number;
  }> = await client.query(
    `
    SELECT id, capacity
    FROM slots
    WHERE id = $1
    FOR UPDATE
    `,
    [slotId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];

  return {
    id: row.id,
    capacity: row.capacity
  };
}

// backend/src/models/slotModel.ts
/**
 * @file slotModel.ts
 * @description Database helpers for slot records.
 */

/**
 * Soft-delete a slot (admin action) by marking it inactive.
 *
 * @param slotId - UUID of the slot to soft-delete.
 * @returns Promise resolving to true when updated (throws if slot not found).
 */
export async function softDeleteSlot(slotId: string): Promise<void> {
  const sql = `
    UPDATE slots
    SET is_active = FALSE
    WHERE id = $1
    RETURNING id;
  `;
  const result = await query<{ id: string }>(sql, [slotId]);

  if (result.rowCount === 0) {
    throw new Error("Slot not found.");
  }
}

/**
 * Hard-delete a slot if it has no confirmed bookings.
 * Returns true if deleted, throws if slot not found or if confirmed bookings exist.
 *
 * @param slotId - UUID of the slot to delete.
 */
export async function hardDeleteSlot(slotId: string): Promise<void> {
  // Hard-delete a slot. Bookings reference slots with ON DELETE CASCADE,
  // so deleting the slot will also remove related bookings if present.
  const delSql = `DELETE FROM slots WHERE id = $1 RETURNING id;`;
  const delResult = await query<{ id: string }>(delSql, [slotId]);

  if (delResult.rowCount === 0) {
    throw new Error("Slot not found.");
  }
}


/**
 * Update the capacity for a slot.
 *
 * @param slotId - UUID of the slot to update.
 * @param capacity - New capacity value (must be >= 0).
 * @returns The updated slot row mapped to a friendly shape.
 */
export async function updateSlotCapacity(
  slotId: string,
  capacity: number
): Promise<{
  readonly id: string;
  readonly doctorId: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly capacity: number;
  readonly confirmedCount: number;
  readonly createdAt: string;
}> {
  // 1) Update capacity and return basic slot row (no confirmed_count reference)
  const sqlUpdate: string = `
    UPDATE slots
    SET capacity = $1
    WHERE id = $2
    RETURNING id, doctor_id, start_time, end_time, capacity, created_at;
  `;
  const values = [capacity, slotId];

  const result: QueryResult<{
    id: string;
  }> = await query<{
    id: string;
  }>(sqlUpdate, values);

  if (result.rowCount === 0) {
    throw new Error("Slot not found.");
  }

  // 2) Retrieve the full slot with meta (uses a safe subquery to compute confirmed_count)
  const slotWithMeta = await getSlotWithMetaById(slotId);

  if (slotWithMeta === null) {
    // This is unexpected because the UPDATE affected a row, but guard anyway.
    throw new Error("Slot not found after update.");
  }

  return slotWithMeta;
}
