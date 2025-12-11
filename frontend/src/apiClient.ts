/**
 * @file apiClient.ts
 * @description Typed API helper functions for communicating with the backend.
 */

import { DoctorSlot } from "./appContext";


/**
 * Payload used to create a doctor via admin API.
 */
interface DoctorCreateRequest {
  readonly name: string;
  readonly specialization: string;
}

/**
 * Response structure for creating a doctor.
 */
interface DoctorCreateResponse {
  readonly doctor: {
    readonly id: string;
    readonly name: string;
    readonly specialization: string;
    readonly createdAt: string;
  };
}

/**
 * Payload used to create a slot via admin API.
 */
interface SlotCreateRequest {
  readonly doctorId: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly capacity: number;
}

/**
 * Response structure for creating a slot.
 */
interface SlotCreateResponse {
  readonly slot: DoctorSlot;
}

/**
 * Payload used to create a booking via public API.
 */
interface BookingCreateRequest {
  readonly slotId: string;
  readonly userName: string;
}

/**
 * Response structure when a booking is created.
 */
interface BookingCreateResponse {
  readonly booking: {
    readonly id: string;
    readonly slotId: string;
    readonly userName: string;
    readonly status: string;
    readonly createdAt: string;
    readonly updatedAt: string;
  };
}

/**
 * Response structure for slot list endpoint.
 */
interface ApiSlotsResponse {
  readonly slots: readonly DoctorSlot[];
}

/**
 * Response structure for single slot endpoint.
 */
interface ApiSlotDetailsResponse {
  readonly slot: DoctorSlot;
}

/**
 * Response structure for get doctors endpoint.
 */
interface DoctorListResponse {
  readonly doctors: readonly {
    readonly id: string;
    readonly name: string;
    readonly specialization: string;
    readonly createdAt: string;
  }[];
}

/**
 * Fetches all doctors for admin UI.
 *
 * @param baseUrl API base url (example: "http://localhost:4000/api")
 * @returns list of doctors
 */
export async function getDoctorsApi(
  baseUrl: string
): Promise<
  {
    readonly id: string;
    readonly name: string;
    readonly specialization: string;
    readonly createdAt: string;
  }[]
> {
  const response: Response = await fetch(`${baseUrl}/admin/doctors`);

  if (!response.ok) {
    throw new Error(`Failed to fetch doctors. Status: ${response.status}`);
  }

  const data: DoctorListResponse = await response.json();
  return [...data.doctors];
}


/**
 * Fetches all slots from the backend API.
 *
 * @param {string} baseUrl Base API endpoint such as "http://localhost:4000/api".
 * @returns {Promise<DoctorSlot[]>} List of slots.
 */
export async function getSlots(baseUrl: string): Promise<DoctorSlot[]> {
  const response: Response = await fetch(`${baseUrl}/slots`);

  if (!response.ok) {
    throw new Error(`Failed to fetch slots. Status: ${response.status}`);
  }

  const data: ApiSlotsResponse = await response.json();
  return [...data.slots];
}

/**
 * Fetches a single slot by its identifier.
 *
 * @param {string} baseUrl Base API endpoint.
 * @param {string} slotId Slot identifier.
 * @returns {Promise<DoctorSlot>} Slot details.
 */
export async function getSlotById(
  baseUrl: string,
  slotId: string
): Promise<DoctorSlot> {
  const response: Response = await fetch(`${baseUrl}/slots/${slotId}`);

  if (response.status === 404) {
    throw new Error("Slot not found.");
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch slot. Status: ${response.status}`);
  }

  const data: ApiSlotDetailsResponse = await response.json();
  return data.slot;
}

/**
 * Creates a doctor via the admin API.
 *
 * @param {string} baseUrl Base API endpoint.
 * @param {DoctorCreateRequest} payload Doctor creation payload.
 * @returns {Promise<DoctorCreateResponse>} Created doctor response.
 */
export async function createDoctorApi(
  baseUrl: string,
  payload: DoctorCreateRequest
): Promise<DoctorCreateResponse> {
  const response: Response = await fetch(`${baseUrl}/admin/doctors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Failed to create doctor. Status: ${response.status}`);
  }

  const data: DoctorCreateResponse = await response.json();
  return data;
}

/**
 * Creates a slot via the admin API.
 *
 * @param {string} baseUrl Base API endpoint.
 * @param {SlotCreateRequest} payload Slot creation payload.
 * @returns {Promise<SlotCreateResponse>} Created slot response.
 */
export async function createSlotApi(
  baseUrl: string,
  payload: SlotCreateRequest
): Promise<SlotCreateResponse> {
  const response: Response = await fetch(`${baseUrl}/admin/slots`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Failed to create slot. Status: ${response.status}`);
  }

  const data: SlotCreateResponse = await response.json();
  return data;
}

/**
 * Creates a booking via the public API.
 *
 * @param {string} baseUrl Base API endpoint.
 * @param {BookingCreateRequest} payload Booking creation payload.
 * @returns {Promise<BookingCreateResponse>} Created booking response.
 */
export async function createBookingApi(
  baseUrl: string,
  payload: BookingCreateRequest
): Promise<BookingCreateResponse> {
  const response: Response = await fetch(`${baseUrl}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (response.status === 404) {
    throw new Error("Slot not found.");
  }

  if (response.status === 409) {
    throw new Error("Slot is full.");
  }

  if (!response.ok) {
    throw new Error(`Failed to create booking. Status: ${response.status}`);
  }

  const data: BookingCreateResponse = await response.json();
  return data;
}

/**
 * Update slot capacity.
 *
 * @param baseUrl - API base URL (e.g. http://localhost:4000/api)
 * @param slotId - Slot UUID
 * @param capacity - New capacity (number)
 */
export async function updateSlotCapacityApi(
  baseUrl: string,
  slotId: string,
  capacity: number
): Promise<{ slot: unknown }> {
  const response: Response = await fetch(`${baseUrl}/admin/slots/${slotId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ capacity })
  });

  if (response.status === 404) {
    throw new Error("Slot not found.");
  }

  if (!response.ok) {
    throw new Error(`Failed to update slot. Status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Soft-delete a slot (mark as deleted without removing from DB).
 *
 * @param baseUrl - API base URL (e.g. http://localhost:4000/api)
 * @param slotId - Slot UUID to delete
 */
export async function deleteSlotApi(
  baseUrl: string,
  slotId: string
): Promise<{ message: string }> {
  const response: Response = await fetch(`${baseUrl}/admin/slots/${slotId}/soft-delete`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (response.status === 404) {
    throw new Error("Slot not found.");
  }

  if (!response.ok) {
    throw new Error(`Failed to delete slot. Status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Delete a doctor. Note: this may fail if the doctor has active slots.
 *
 * @param baseUrl - API base URL (e.g. http://localhost:4000/api)
 * @param doctorId - Doctor UUID to delete
 */
export async function deleteDoctorApi(
  baseUrl: string,
  doctorId: string
): Promise<{ message: string }> {
  const response: Response = await fetch(`${baseUrl}/admin/doctors/${doctorId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (response.status === 404) {
    throw new Error("Doctor not found.");
  }

  if (response.status === 403) {
    throw new Error("Cannot delete doctor with active slots.");
  }

  if (!response.ok) {
    throw new Error(`Failed to delete doctor. Status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
