"use strict";
/**
 * @file validation.ts
 * @description Zod schemas and TypeScript types for validating request bodies.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBookingSchema = exports.createSlotSchema = exports.createDoctorSchema = void 0;
const zod_1 = require("zod");
/**
 * Schema used to validate the payload for creating a doctor.
 */
exports.createDoctorSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, { message: "Name is required." })
        .max(255, { message: "Name must be at most 255 characters." }),
    specialization: zod_1.z
        .string()
        .min(1, { message: "Specialization is required." })
        .max(255, { message: "Specialization must be at most 255 characters." })
});
/**
 * Schema used to validate the payload for creating a slot.
 */
exports.createSlotSchema = zod_1.z.object({
    doctorId: zod_1.z
        .string()
        .uuid({ message: "doctorId must be a valid UUID." }),
    startTime: zod_1.z
        .string()
        .min(1, { message: "startTime is required." }),
    endTime: zod_1.z
        .string()
        .min(1, { message: "endTime is required." }),
    capacity: zod_1.z
        .number()
        .int({ message: "capacity must be an integer." })
        .positive({ message: "capacity must be greater than 0." })
});
/**
 * Schema used to validate the payload for creating a booking.
 */
exports.createBookingSchema = zod_1.z.object({
    slotId: zod_1.z
        .string()
        .uuid({ message: "slotId must be a valid UUID." }),
    userName: zod_1.z
        .string()
        .min(1, { message: "userName is required." })
        .max(255, { message: "userName must be at most 255 characters." })
});
