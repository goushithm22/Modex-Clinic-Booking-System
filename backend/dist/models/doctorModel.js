"use strict";
// backend/src/models/doctorModel.ts
/**
 * @file doctorModel.ts
 * @description DB helpers for doctor records.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDoctor = createDoctor;
exports.getAllDoctors = getAllDoctors;
exports.deleteDoctor = deleteDoctor;
const db_1 = __importDefault(require("../config/db"));
const uuid_1 = require("../utils/uuid");
/**
 * Inserts a new doctor and returns the inserted row.
 *
 * @param name Doctor name.
 * @param specialization Doctor specialization.
 */
async function createDoctor(name, specialization) {
    const id = (0, uuid_1.generateUuid)();
    const sql = `
    INSERT INTO doctors (id, name, specialization)
    VALUES ($1, $2, $3)
    RETURNING id, name, specialization, created_at;
  `;
    const values = [id, name, specialization];
    const result = await db_1.default.query(sql, values);
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
async function getAllDoctors() {
    const sql = `
    SELECT id, name, specialization, created_at
    FROM doctors
    ORDER BY created_at DESC
    LIMIT 100;
  `;
    const result = await db_1.default.query(sql);
    return result.rows.map((r) => ({
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
async function deleteDoctor(doctorId) {
    // Check if doctor exists
    const checkSql = "SELECT id FROM doctors WHERE id = $1";
    const checkResult = await db_1.default.query(checkSql, [doctorId]);
    if (checkResult.rows.length === 0) {
        throw new Error("Doctor not found.");
    }
    // Hard-delete the doctor. `slots` references `doctors` with
    // ON DELETE CASCADE and `bookings` references `slots` with
    // ON DELETE CASCADE in the DB schema, so deleting the doctor
    // will remove related slots and bookings automatically.
    const deleteSql = "DELETE FROM doctors WHERE id = $1";
    await db_1.default.query(deleteSql, [doctorId]);
}
