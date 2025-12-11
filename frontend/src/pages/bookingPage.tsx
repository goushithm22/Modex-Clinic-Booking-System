/// <reference types="react" />
/**
 * @file bookingPage.tsx
 * @description Page for booking a single appointment slot.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAppContext, DoctorSlot } from "../appContext";
import { getSlotById, createBookingApi } from "../apiClient";

/**
 * Local state for the booking form.
 */
interface BookingFormState {
  readonly userName: string;
}

/**
 * Booking page component that loads a single slot and allows
 * the user to confirm a booking.
 *
 * @returns {JSX.Element} Booking page.
 */
export function BookingPage(): React.ReactElement {
  const routeParams = useParams();
  const navigate = useNavigate();
  const { apiBaseUrl, refreshSlots } = useAppContext();

  const [slot, setSlot] = useState<DoctorSlot | null>(null);
  const [formState, setFormState] = useState<BookingFormState>({
    userName: ""
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  // Stores the user's preferred time selected in the UI.
  const [preferredTime, setPreferredTime] = useState<string | null>(null);

  const slotId: string | undefined = routeParams.slotId;

  /**
   * Loads slot details from the backend API based on route parameter.
   */
  useEffect(() => {
    async function loadSlot(): Promise<void> {
      if (slotId === undefined) {
        setBookingMessage("Invalid slot identifier.");
        return;
      }
      try {
        const fetchedSlot: DoctorSlot = await getSlotById(apiBaseUrl, slotId);
        setSlot(fetchedSlot);
        // initialize preferred time to the slot startTime by default
        setPreferredTime(fetchedSlot.startTime);
      } catch (error) {
        const message: string =
          error instanceof Error ? error.message : "Could not load appointment slot.";
        setBookingMessage(message);
      }
    }

    void loadSlot();
  }, [apiBaseUrl, slotId]);

  /**
   * Handles updates to form input fields.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event Input change event.
   */
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = event.target;
    setFormState((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  /**
   * Handles submission of the booking form.
   *
   * @param {React.FormEvent<HTMLFormElement>} event Form submit event.
   */
  /**
   * Generate a set of candidate times inside the slot's start/end range.
   * We create `capacity` evenly spaced choices (or a single time if capacity is 1).
   * This hook is called at the top level to comply with React hooks rules.
   */
  const timeOptions: string[] = useMemo((): string[] => {
    if (slot === null) return [];
    const startMs: number = new Date(slot.startTime).getTime();
    const endMs: number = new Date(slot.endTime).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
      return [slot.startTime];
    }
    const count: number = Math.max(1, slot.capacity);
    if (count === 1) return [new Date(startMs).toISOString()];
    const interval: number = (endMs - startMs) / count;
    const opts: string[] = [];
    for (let i = 0; i < count; i++) {
      const t = new Date(Math.floor(startMs + interval * i));
      opts.push(t.toISOString());
    }
    return opts;
  }, [slot]);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (slotId === undefined) {
      setBookingMessage("Invalid slot identifier.");
      return;
    }

    const trimmedName: string = formState.userName.trim();

    if (trimmedName.length === 0) {
      setBookingMessage("Please enter your name before booking.");
      return;
    }

    try {
      setIsSubmitting(true);
      setBookingMessage(null);

      await createBookingApi(apiBaseUrl, {
        slotId,
        userName: trimmedName
      });

        // Refresh global slot list so other users see updates immediately.
        void refreshSlots();

      const chosenTimeNote: string =
        preferredTime !== null ? ` Preferred time: ${new Date(preferredTime).toLocaleString()}.` : "";

      setBookingMessage(
        `Booking confirmed successfully.${chosenTimeNote} Redirecting to home...`
      );
      // Short delay so the user can read the confirmation.
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      const message: string =
        error instanceof Error ? error.message : "Failed to create booking.";
      // If another user just filled the slot, refresh the slot list so it disappears.
      if (message === "Slot is full.") {
        void refreshSlots();
      }
      setBookingMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (slot === null) {
    return (
      <section className="pageContainer">
        <header className="pageHeader">
          <h1>Booking appointment</h1>
        </header>
        <p>Loading appointment details...</p>
        {bookingMessage !== null && (
          <p className="infoMessage">{bookingMessage}</p>
        )}
      </section>
    );
  }

  const readableTime: string = new Date(slot.startTime).toLocaleString();

  return (
    <section className="pageContainer">
      <header className="pageHeader">
        <h1>Confirm your appointment</h1>
        <p>
          You are booking an appointment with Dr. {slot.doctorName} on{" "}
          {readableTime}.
        </p>
      </header>

      <article className="slotCard slotCardWide">
        <p className="slotDetail">
          <span className="slotLabel">Doctor:</span> Dr. {slot.doctorName} (
          {slot.doctorSpecialization})
        </p>
        <p className="slotDetail">
          <span className="slotLabel">Time:</span> {readableTime}
        </p>
        <p className="slotDetail">
          <span className="slotLabel">Available:</span> {slot.availableSeats}
        </p>
      </article>

      {/* Preferred time picker (UI-only; not sent to backend in this iteration) */}
      {timeOptions.length > 0 && (
        <fieldset className="timeOptions" aria-labelledby="preferred-time-legend">
          <legend id="preferred-time-legend" className="formLabel">Preferred time</legend>
          <div className="timeOptionsList">
            {timeOptions.map((opt: string) => (
              <label className="timeOption" key={opt}>
                <input
                  type="radio"
                  name="preferredTime"
                  value={opt}
                  checked={preferredTime === opt}
                  onChange={() => setPreferredTime(opt)}
                />
                <span className="timeOptionLabel">{new Date(opt).toLocaleString()}</span>
              </label>
            ))}
          </div>
          <p className="timeNote">Selected time is a preference only; booking records the slot.</p>
        </fieldset>
      )}

      <form className="bookingForm" onSubmit={handleSubmit}>
        <label className="formLabel" htmlFor="userName">
          Your name
        </label>
        <input
          id="userName"
          name="userName"
          type="text"
          className="formInput"
          value={formState.userName}
          onChange={handleInputChange}
          placeholder="Enter your full name"
        />
        {bookingMessage !== null && (
          <p className="infoMessage">{bookingMessage}</p>
        )}
        <div className="formActions">
          <Link to="/" className="secondaryButton">
            Cancel
          </Link>
          <button
            type="submit"
            className="primaryButton"
            disabled={isSubmitting || slot.availableSeats <= 0}
          >
            {isSubmitting ? "Booking..." : "Confirm booking"}
          </button>
        </div>
      </form>
    </section>
  );
}
