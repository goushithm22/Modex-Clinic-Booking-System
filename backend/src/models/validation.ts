/**
 * @file validation.ts
 * @description Zod schemas and TypeScript types for validating request bodies.
 */

import { z } from "zod";

/**
 * Schema used to validate the payload for creating a doctor.
 */
export const createDoctorSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required." })
    .max(255, { message: "Name must be at most 255 characters." }),
  specialization: z
    .string()
    .min(1, { message: "Specialization is required." })
    .max(255, { message: "Specialization must be at most 255 characters." })
});

/**
 * TypeScript type representing a valid create doctor payload.
 */
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;

/**
 * Schema used to validate the payload for creating a slot.
 */
export const createSlotSchema = z.object({
  doctorId: z
    .string()
    .uuid({ message: "doctorId must be a valid UUID." }),
  startTime: z
    .string()
    .min(1, { message: "startTime is required." }),
  endTime: z
    .string()
    .min(1, { message: "endTime is required." }),
  capacity: z
    .number()
    .int({ message: "capacity must be an integer." })
    .positive({ message: "capacity must be greater than 0." })
});

/**
 * TypeScript type representing a valid create slot payload.
 */
export type CreateSlotInput = z.infer<typeof createSlotSchema>;

/**
 * Schema used to validate the payload for creating a booking.
 */
export const createBookingSchema = z.object({
  slotId: z
    .string()
    .uuid({ message: "slotId must be a valid UUID." }),
  userName: z
    .string()
    .min(1, { message: "userName is required." })
    .max(255, { message: "userName must be at most 255 characters." })
});

/**
 * TypeScript type representing a valid create booking payload.
 */
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
