/**
 * @file adminController.ts
 * @description Handlers for admin-facing routes (doctors and slots).
 */
import { softDeleteSlot, hardDeleteSlot } from "../models/slotModel";
import { Request, Response, NextFunction } from "express";
import {
  createDoctorSchema,
  createSlotSchema,
  CreateDoctorInput,
  CreateSlotInput
} from "../models/validation";
import { createDoctor, getAllDoctors, deleteDoctor } from "../models/doctorModel";
import { createSlot } from "../models/slotModel";

/**
 * Handles creation of a new doctor.
 *
 * @param {Request} req Express request containing the doctor payload.
 * @param {Response} res Express response used to send the created doctor.
 * @param {NextFunction} next Next middleware in the chain.
 * @returns {Promise<void>} Promise that resolves when the response is sent.
 */
export async function handleCreateDoctor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parseResult = createDoctorSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        error: "Invalid doctor payload.",
        details: parseResult.error.format()
      });
      return;
    }

    const data: CreateDoctorInput = parseResult.data;

    const doctor = await createDoctor(data.name, data.specialization);

    res.status(201).json({
      doctor
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves all doctors.
 *
 * @param {Request} _req Express request (unused).
 * @param {Response} res Express response used to send doctors.
 * @param {NextFunction} next Next middleware in the chain.
 * @returns {Promise<void>} Promise that resolves when the response is sent.
 */
export async function handleGetDoctors(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const doctors = await getAllDoctors();
    res.status(200).json({
      doctors
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles deletion of a doctor.
 *
 * @param {Request} req Express request containing doctor ID in params.
 * @param {Response} res Express response.
 * @param {NextFunction} next Next middleware in the chain.
 * @returns {Promise<void>} Promise that resolves when the response is sent.
 */
export async function handleDeleteDoctor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const doctorId: string | undefined = req.params.doctorId;

    if (doctorId === undefined || doctorId.trim().length === 0) {
      res.status(400).json({
        error: "Invalid doctor identifier."
      });
      return;
    }

    await deleteDoctor(doctorId);

    res.status(200).json({
      message: "Doctor deleted successfully."
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Doctor not found.") {
      res.status(404).json({
        error: "Doctor not found."
      });
      return;
    }
    if (error instanceof Error && error.message === "Cannot delete doctor with active bookings.") {
      res.status(403).json({
        error: error.message
      });
      return;
    }
    next(error);
  }
}

/**
 * Handles creation of a new slot.
 *
 * @param {Request} req Express request containing the slot payload.
 * @param {Response} res Express response used to send the created slot.
 * @param {NextFunction} next Next middleware in the chain.
 * @returns {Promise<void>} Promise that resolves when the response is sent.
 */
export async function handleCreateSlot(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const bodyRaw = req.body;

    // Capacity might arrive as string if sent as JSON without proper typing.
    const normalizedBody = {
      ...bodyRaw,
      capacity:
        typeof bodyRaw.capacity === "string"
          ? Number(bodyRaw.capacity)
          : bodyRaw.capacity
    };

    const parseResult = createSlotSchema.safeParse(normalizedBody);

    if (!parseResult.success) {
      res.status(400).json({
        error: "Invalid slot payload.",
        details: parseResult.error.format()
      });
      return;
    }

    const data: CreateSlotInput = parseResult.data;

    const slot = await createSlot(
      data.doctorId,
      data.startTime,
      data.endTime,
      data.capacity
    );

    res.status(201).json({
      slot
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles updating slot fields (currently supports capacity).
 *
 * PATCH /api/admin/slots/:slotId
 */
import { updateSlotCapacity as updateSlotCapacityModel } from "../models/slotModel";

/**
 * Update slot capacity handler.
 */
export async function handleUpdateSlot(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const slotId: string | undefined = req.params.slotId;

    if (slotId === undefined || slotId.trim().length === 0) {
      res.status(400).json({ error: "Invalid slot identifier." });
      return;
    }

    const body = req.body as { capacity?: unknown };

    if (body.capacity === undefined) {
      res.status(400).json({ error: "Missing capacity in request body." });
      return;
    }

    const capacityNumber: number =
      typeof body.capacity === "string" ? Number(body.capacity) : Number(body.capacity);

    if (Number.isNaN(capacityNumber) || !Number.isFinite(capacityNumber) || capacityNumber < 0) {
      res.status(400).json({ error: "Capacity must be a non-negative number." });
      return;
    }

    const updated = await updateSlotCapacityModel(slotId, Math.trunc(capacityNumber));

    res.status(200).json({ slot: updated });
  } catch (error) {
    // Log error for debugging.
    // eslint-disable-next-line no-console
    console.error("Error in handleUpdateSlot:", error);
    if (error instanceof Error && error.message === "Slot not found.") {
      res.status(404).json({ error: "Slot not found." });
      return;
    }
    next(error);
  }
}

/**
 * PATCH /api/admin/slots/:slotId/soft-delete
 * Admin soft-deletes a slot (marks inactive).
 */
export async function handleSoftDeleteSlot(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const slotId = req.params.slotId;
    if (!slotId || slotId.trim().length === 0) {
      res.status(400).json({ error: "Invalid slot id." });
      return;
    }

    await softDeleteSlot(slotId);

    res.status(200).json({ message: "Slot soft-deleted (inactive)." });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in handleSoftDeleteSlot:", error);
    if (error instanceof Error && error.message === "Slot not found.") {
      res.status(404).json({ error: "Slot not found." });
      return;
    }
    next(error);
  }
}

/**
 * Handles hard deletion of a slot (admin action).
 * DELETE /api/admin/slots/:slotId
 */
export async function handleHardDeleteSlot(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const slotId = req.params.slotId;
    if (!slotId || slotId.trim().length === 0) {
      res.status(400).json({ error: "Invalid slot id." });
      return;
    }

    await hardDeleteSlot(slotId);

    res.status(200).json({ message: "Slot deleted permanently." });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in handleHardDeleteSlot:", error);
    if (error instanceof Error && error.message === "Slot not found.") {
      res.status(404).json({ error: "Slot not found." });
      return;
    }
    next(error);
  }
}

