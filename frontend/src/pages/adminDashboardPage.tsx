/// <reference types="react" />
/**
 * @file adminDashboardPage.tsx
 * @description Admin dashboard to create doctors and slots and view current slots.
 */

import React, { useState, useEffect, useRef } from "react";
import { useAppContext, DoctorSlot } from "../appContext";
import {
  createDoctorApi,
  createSlotApi,
  getDoctorsApi,
  updateSlotCapacityApi,
  deleteSlotApi,
  deleteDoctorApi
} from "../apiClient";

/**
 * Local state for doctor creation form.
 */
interface DoctorFormState {
  readonly name: string;
  readonly specialization: string;
}

/**
 * Local state for slot creation form.
 */
interface SlotFormState {
  readonly doctorId: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly capacity: number;
}

/**
 * Stores information about a doctor.
 */
interface DoctorSummary {
  readonly id: string;
  readonly name: string;
  readonly specialization: string;
}

export function AdminDashboardPage(): React.ReactElement {
  const { apiBaseUrl, slots, refreshSlots } = useAppContext();

  const [doctorForm, setDoctorForm] = useState<DoctorFormState>({
    name: "",
    specialization: ""
  });

  const [slotForm, setSlotForm] = useState<SlotFormState>({
    doctorId: "",
    startTime: "",
    endTime: "",
    capacity: 1
  });

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Persisted doctor list fetched from backend.
  const [doctorList, setDoctorList] = useState<DoctorSummary[]>([]);

  // For inline editing of a slot's capacity:
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editingCapacity, setEditingCapacity] = useState<number>(1);
  const [isSavingCapacity, setIsSavingCapacity] = useState<boolean>(false);

  // For delete confirmation dialogs
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "doctor" | "slot"; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load persisted doctors on mount
  useEffect(() => {
    async function loadDoctors(): Promise<void> {
      try {
        const remote = await getDoctorsApi(apiBaseUrl);
        const mapped = remote.map((d) => ({
          id: d.id,
          name: d.name,
          specialization: d.specialization
        }));
        setDoctorList(mapped);
      } catch {
        // ignore for now
      }
    }
    void loadDoctors();
  }, [apiBaseUrl]);

  const handleDoctorInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = event.target;
    setDoctorForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSlotInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = event.target;

    if (name === "capacity") {
      const numericValue: number = Number(value);
      setSlotForm((previous) => ({
        ...previous,
        capacity: Number.isNaN(numericValue) ? 1 : numericValue
      }));
    } else {
      setSlotForm((previous) => ({
        ...previous,
        [name]: value
      }));
    }
  };

  const handleCreateDoctor = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    const trimmedName: string = doctorForm.name.trim();
    const trimmedSpecialization: string = doctorForm.specialization.trim();

    if (trimmedName.length === 0) {
      setFeedbackMessage("Doctor name is required.");
      return;
    }

    if (trimmedSpecialization.length === 0) {
      setFeedbackMessage("Doctor specialization is required.");
      return;
    }

    try {
      await createDoctorApi(apiBaseUrl, {
        name: trimmedName,
        specialization: trimmedSpecialization
      });

      setFeedbackMessage("Doctor created successfully.");

      // Refresh doctors list
      try {
        const remote = await getDoctorsApi(apiBaseUrl);
        const mapped = remote.map((d) => ({
          id: d.id,
          name: d.name,
          specialization: d.specialization
        }));
        setDoctorList(mapped);
      } catch {
        /* fallback ignored */
      }

      setDoctorForm({
        name: "",
        specialization: ""
      });
    } catch (error) {
      const message: string =
        error instanceof Error ? error.message : "Failed to create doctor.";
      setFeedbackMessage(message);
    }
  };

  const handleCreateSlot = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    const trimmedDoctorId: string = slotForm.doctorId.trim();

    if (trimmedDoctorId.length === 0) {
      setFeedbackMessage("Doctor ID is required for a slot.");
      return;
    }

    if (slotForm.startTime.trim().length === 0) {
      setFeedbackMessage("Slot start time is required.");
      return;
    }

    if (slotForm.endTime.trim().length === 0) {
      setFeedbackMessage("Slot end time is required.");
      return;
    }

    if (slotForm.capacity <= 0) {
      setFeedbackMessage("Capacity must be greater than zero.");
      return;
    }

    try {
      await createSlotApi(apiBaseUrl, {
        doctorId: trimmedDoctorId,
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        capacity: slotForm.capacity
      });

      setFeedbackMessage("Slot created successfully.");

      setSlotForm({
        doctorId: "",
        startTime: "",
        endTime: "",
        capacity: 1
      });

      await refreshSlots();
    } catch (error) {
      const message: string =
        error instanceof Error ? error.message : "Failed to create slot.";
      setFeedbackMessage(message);
    }
  };

    // Ref to store the current timeout id for clearing feedback message
  const copyTimeoutRef = useRef<number | null>(null);

  /**
   * Copies the provided text to clipboard. Falls back to textarea method if
   * navigator.clipboard is unavailable. Shows brief feedback message on success.
   *
   * @param text Text to copy to clipboard.
   */
  async function copyToClipboard(text: string): Promise<void> {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers: create a hidden textarea and copy
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      // show feedback and clear after 2.2s
      setFeedbackMessage("Doctor ID copied to clipboard.");
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setFeedbackMessage(null);
        copyTimeoutRef.current = null;
      }, 2200);
    } catch {
      setFeedbackMessage("Failed to copy ID. Please copy manually.");
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setFeedbackMessage(null);
        copyTimeoutRef.current = null;
      }, 3000);
    }
  }

  /**
   * Click / keyboard handler for copying doctor id.
   *
   * @param id Doctor id to copy
   */
  function handleCopyId(id: string): void {
  void copyToClipboard(id);

  // Auto-fill the Create Slot form
  setSlotForm((prev) => ({
    ...prev,
    doctorId: id
  }));

  setFeedbackMessage("Doctor ID copied & filled into slot form.");

  // Clear after 2 seconds
  setTimeout(() => setFeedbackMessage(null), 2000);
}



  // --- Inline editing helpers ---
  function startEditCapacity(slot: DoctorSlot): void {
    setEditingSlotId(slot.id);
    setEditingCapacity(slot.capacity);
    setFeedbackMessage(null);
  }

  function cancelEditCapacity(): void {
    setEditingSlotId(null);
    setEditingCapacity(1);
  }

  async function saveCapacity(slotId: string): Promise<void> {
    setIsSavingCapacity(true);
    setFeedbackMessage(null);
    try {
      await updateSlotCapacityApi(apiBaseUrl, slotId, editingCapacity);
      setFeedbackMessage("Slot capacity updated.");
      setEditingSlotId(null);
      setEditingCapacity(1);
      await refreshSlots();
    } catch (error) {
      const message: string =
        error instanceof Error ? error.message : "Failed to update slot capacity.";
      setFeedbackMessage(message);
    } finally {
      setIsSavingCapacity(false);
    }
  }

  /**
   * Initiates delete confirmation for a doctor.
   */
  function initiateDeleteDoctor(doctorId: string, doctorName: string): void {
    setDeleteConfirm({ type: "doctor", id: doctorId, name: doctorName });
  }

  /**
   * Initiates delete confirmation for a slot.
   */
  function initiateDeleteSlot(slotId: string, slotName: string): void {
    setDeleteConfirm({ type: "slot", id: slotId, name: slotName });
  }

  /**
   * Confirms and executes deletion of doctor or slot.
   */
  async function confirmDelete(): Promise<void> {
    if (deleteConfirm === null) return;

    setIsDeleting(true);
    setFeedbackMessage(null);
    try {
      if (deleteConfirm.type === "doctor") {
        await deleteDoctorApi(apiBaseUrl, deleteConfirm.id);
        setFeedbackMessage(`Doctor "${deleteConfirm.name}" deleted successfully.`);
        // Refresh doctors list
        const remote = await getDoctorsApi(apiBaseUrl);
        const mapped = remote.map((d) => ({
          id: d.id,
          name: d.name,
          specialization: d.specialization
        }));
        setDoctorList(mapped);
      } else if (deleteConfirm.type === "slot") {
        await deleteSlotApi(apiBaseUrl, deleteConfirm.id);
        setFeedbackMessage("Slot deleted successfully.");
        await refreshSlots();
      }
      setDeleteConfirm(null);
    } catch (error) {
      const message: string =
        error instanceof Error ? error.message : "Failed to delete.";
      setFeedbackMessage(message);
    } finally {
      setIsDeleting(false);
    }
  }

  /**
   * Cancels the delete confirmation dialog.
   */
  function cancelDelete(): void {
    setDeleteConfirm(null);
  }

  return (
    <section className="pageContainer">
      <header className="pageHeader">
        <h1>Admin dashboard</h1>
      </header>

      {feedbackMessage !== null && (
        <p className="infoMessage">{feedbackMessage}</p>
      )}

      <div className="adminGrid">
        <form className="adminCard" onSubmit={handleCreateDoctor}>
          <h2>Create doctor</h2>
          <label className="formLabel" htmlFor="doctorName">
            Name
          </label>
          <input
            id="doctorName"
            name="name"
            type="text"
            className="formInput"
            value={doctorForm.name}
            onChange={handleDoctorInputChange}
            placeholder="Dr. John Doe"
          />
          <label className="formLabel" htmlFor="doctorSpecialization">
            Specialization
          </label>
          <input
            id="doctorSpecialization"
            name="specialization"
            type="text"
            className="formInput"
            value={doctorForm.specialization}
            onChange={handleDoctorInputChange}
            placeholder="Cardiologist"
          />
          <button type="submit" className="primaryButton">
            Create doctor
          </button>
        </form>

        <form className="adminCard" onSubmit={handleCreateSlot}>
          <h2>Create slot</h2>
          <label className="formLabel" htmlFor="slotDoctorId">
            Doctor ID
          </label>
          <input
            id="slotDoctorId"
            name="doctorId"
            type="text"
            className="formInput"
            value={slotForm.doctorId}
            onChange={handleSlotInputChange}
            placeholder="Paste doctor ID here"
          />
          <label className="formLabel" htmlFor="slotStartTime">
            Start time
          </label>
          <input
            id="slotStartTime"
            name="startTime"
            type="datetime-local"
            className="formInput"
            value={slotForm.startTime}
            onChange={handleSlotInputChange}
          />
          <label className="formLabel" htmlFor="slotEndTime">
            End time
          </label>
          <input
            id="slotEndTime"
            name="endTime"
            type="datetime-local"
            className="formInput"
            value={slotForm.endTime}
            onChange={handleSlotInputChange}
          />
          <label className="formLabel" htmlFor="slotCapacity">
            Capacity
          </label>
          <input
            id="slotCapacity"
            name="capacity"
            type="number"
            min={1}
            className="formInput"
            value={slotForm.capacity}
            onChange={handleSlotInputChange}
          />
          <button type="submit" className="primaryButton">
            Create slot
          </button>
        </form>
      </div>

      <section className="adminCard adminTableCard">
        <h2>Recently created doctors</h2>
        {doctorList.length === 0 ? (
          <p className="emptyStateText">No doctors found.</p>
        ) : (
          <div className="tableWrapper">
            <table className="slotTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Specialization</th>
                  <th>Doctor ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctorList.map((doctor) => (
                  <tr key={doctor.id}>
                    <td>Dr. {doctor.name}</td>
                    <td>{doctor.specialization}</td>
                    <td>
                    <span
                      className="idChip idChipClickable"
                      role="button"
                      tabIndex={0}
                      title="Click to copy ID"
                      onClick={() => handleCopyId(doctor.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          // space/enter triggers copy
                          e.preventDefault();
                          handleCopyId(doctor.id);
                        }
                      }}
                      aria-label={`Copy doctor id ${doctor.id}`}
                    >
                      {doctor.id}
                    </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="dangerButton"
                        onClick={() => initiateDeleteDoctor(doctor.id, doctor.name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="adminCard adminTableCard">
        <h2>Current slots</h2>
        {slots.length === 0 ? (
          <p className="emptyStateText">No slots have been created yet.</p>
        ) : (
          <div className="tableWrapper">
            <table className="slotTable">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Time</th>
                  <th>Capacity</th>
                  <th>Booked</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => {
                  const readableTime: string = new Date(slot.startTime).toLocaleString();
                  const isEditing: boolean = editingSlotId === slot.id;
                  return (
                    <tr key={slot.id}>
                      <td>{slot.doctorName}</td>
                      <td>{slot.doctorSpecialization}</td>
                      <td>{readableTime}</td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            className="formInput"
                            value={editingCapacity}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setEditingCapacity(Number.isNaN(v) ? 0 : v);
                            }}
                          />
                        ) : (
                          slot.capacity
                        )}
                      </td>
                      <td>{slot.confirmedCount}</td>
                      <td>{slot.availableSeats}</td>
                      <td>
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              className="primaryButton"
                              onClick={() => void saveCapacity(slot.id)}
                              disabled={isSavingCapacity}
                            >
                              {isSavingCapacity ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              className="secondaryButton"
                              onClick={cancelEditCapacity}
                              style={{ marginLeft: "0.4rem" }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="secondaryButton"
                              onClick={() => startEditCapacity(slot)}
                            >
                              Edit capacity
                            </button>
                            <button
                              type="button"
                              className="dangerButton"
                              onClick={() => initiateDeleteSlot(slot.id, `${slot.doctorName}'s slot`)}
                              style={{ marginLeft: "0.4rem" }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="adminCard adminTableCard">
        <h2>Recent bookings</h2>
        {slots.flatMap(s => (s.bookings ?? []).map(b => ({ slot: s, booking: b }))).length === 0 ? (
          <p className="emptyStateText">No bookings yet.</p>
        ) : (
          <div className="tableWrapper">
            <table className="slotTable">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Booked At</th>
                </tr>
              </thead>
              <tbody>
                {slots.flatMap((s) =>
                  (s.bookings ?? []).map((b) => (
                    <tr key={b.id}>
                      <td>{s.doctorName}</td>
                      <td>{new Date(s.startTime).toLocaleString()}</td>
                      <td>{b.userName}</td>
                      <td>{new Date(b.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Delete confirmation dialog */}
      {deleteConfirm !== null && (
        <div className="confirmationOverlay">
          <div className="confirmationDialog">
            <h3>Confirm deletion</h3>
            <p>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
              {deleteConfirm.type === "doctor" && " All associated slots will remain but will be orphaned."}
            </p>
            <div className="confirmationActions">
              <button
                type="button"
                className="secondaryButton"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dangerButton"
                onClick={() => void confirmDelete()}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
