/**
 * @file types.ts
 * @description Shared domain types for doctors, slots, and bookings.
 */

export type BookingStatus = "PENDING" | "CONFIRMED" | "FAILED";

/**
 * Represents a doctor entity stored in the database.
 */
export interface Doctor {
  readonly id: string;
  readonly name: string;
  readonly specialization: string;
  readonly createdAt: string;
}

/**
 * Represents a slot entity stored in the database.
 */
export interface Slot {
  readonly id: string;
  readonly doctorId: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly capacity: number;
  readonly createdAt: string;
}

/**
 * Represents a booking entity stored in the database.
 */
export interface Booking {
  readonly id: string;
  readonly slotId: string;
  readonly userName: string;
  readonly status: BookingStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Represents a slot along with additional aggregated data.
 */
export interface SlotWithMeta {
  readonly id: string;
  readonly doctorId: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly capacity: number;
  readonly createdAt: string;
  readonly doctorName: string;
  readonly doctorSpecialization: string;
  readonly confirmedCount: number;
  readonly availableSeats: number;
  readonly bookings?: readonly {
    readonly id: string;
    readonly userName: string;
    readonly status: string;
    readonly createdAt: string;
  }[];
}
