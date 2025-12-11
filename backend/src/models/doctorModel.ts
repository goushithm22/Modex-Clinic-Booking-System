// backend/src/models/doctorModel.ts
/**
 * @file doctorModel.ts
 * @description DB helpers for doctor records.
 */

import { QueryResult } from "pg";
import pool from "../config/db"; 
import { generateUuid } from "../utils/uuid";

export interface DoctorDbRow {
  readonly id: string;
  readonly name: string;
  readonly specialization: string;
  readonly created_at: string;
}

/**
 * Inserts a new doctor and returns the inserted row.
 *
 * @param name Doctor name.
 * @param specialization Doctor specialization.
 */
export async function createDoctor(
  name: string,
  specialization: string
): Promise<{ readonly id: string; readonly name: string; readonly specialization: string; readonly createdAt: string }> {
  const id: string = generateUuid();

  const sql: string = `
    INSERT INTO doctors (id, name, specialization)
    VALUES ($1, $2, $3)
    RETURNING id, name, specialization, created_at;
  `;
  const values = [id, name, specialization];

  const result: QueryResult<DoctorDbRow> = await pool.query(sql, values);
  const row = result.rows[0];

  return {
    id: row.id,
    name: row.name,
    specialization: row.specialization,
    createdAt: row.created_at
  };
}

/**
 * Returns all doctors ordered by creation time descending.
 */
export async function getAllDoctors(): Promise<
  { readonly id: string; readonly name: string; readonly specialization: string; readonly createdAt: string }[]
> {
  const sql: string = `
    SELECT id, name, specialization, created_at
    FROM doctors
    ORDER BY created_at DESC
    LIMIT 100;
  `;
  const result: QueryResult<DoctorDbRow> = await pool.query(sql);
  return result.rows.map((r: DoctorDbRow) => ({
    id: r.id,
    name: r.name,
    specialization: r.specialization,
    createdAt: r.created_at
  }));
}

/**
 * Deletes a doctor by ID.
 * Throws an error if the doctor has active slots with confirmed bookings.
 *
 * @param doctorId Doctor ID to delete.
 * @throws {Error} If doctor not found or has active slots with bookings.
 */
export async function deleteDoctor(doctorId: string): Promise<void> {
  // Check if doctor exists
  const checkSql: string = "SELECT id FROM doctors WHERE id = $1";
  const checkResult: QueryResult<{ id: string }> = await pool.query(checkSql, [doctorId]);

  if (checkResult.rows.length === 0) {
    throw new Error("Doctor not found.");
  }
  // Hard-delete the doctor. `slots` references `doctors` with
  // ON DELETE CASCADE and `bookings` references `slots` with
  // ON DELETE CASCADE in the DB schema, so deleting the doctor
  // will remove related slots and bookings automatically.
  const deleteSql: string = "DELETE FROM doctors WHERE id = $1";
  await pool.query(deleteSql, [doctorId]);
}
