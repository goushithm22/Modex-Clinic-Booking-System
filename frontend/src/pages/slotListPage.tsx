/// <reference types="react" />
/**
 * @file slotListPage.tsx
 * @description Patient-facing page displaying available doctor slots.
 */

import { Link } from "react-router-dom";
import { useAppContext, DoctorSlot } from "../appContext";

/**
 * Card displaying summary details of a doctor slot.
 *
 * @param {DoctorSlot} slot Slot information to render.
 * @returns {JSX.Element} Slot card component.
 */
function SlotCard(slot: DoctorSlot): React.ReactElement {
  const slotDate: Date = new Date(slot.startTime);
  const readableDate: string = slotDate.toLocaleString();

  return (
    <article className="slotCard">
      <h2 className="slotTitle">
        Dr. {slot.doctorName}
      </h2>
      <p className="slotSubtitle">
        {slot.doctorSpecialization}
      </p>
      <p className="slotDetail">
        <span className="slotLabel">Time:</span> {readableDate}
      </p>
      <p className="slotDetail">
        <span className="slotLabel">Capacity:</span> {slot.capacity}
      </p>
      <p className="slotDetail">
        <span className="slotLabel">Available:</span> {slot.availableSeats}
      </p>
      <div className="slotActions">
        <Link
          to={`/booking/${slot.id}`}
          className={`primaryButton ${
            slot.availableSeats <= 0 ? "buttonDisabled" : ""
          }`}
        >
          {slot.availableSeats > 0 ? "Book appointment" : "Fully booked"}
        </Link>
      </div>
    </article>
  );
}

/**
 * Page component that lists all available slots for patients.
 *
 * @returns {JSX.Element} Slot list page.
 */
export function SlotListPage(): React.ReactElement {
  const { slots } = useAppContext();

  return (
    <section className="pageContainer">
      <header className="pageHeader">
        <h1>Available appointments</h1>
        <p>
          Choose a doctor and time that works best for you. Booking is instant and
          respects real-time capacity from the backend.
        </p>
      </header>
      {slots.length === 0 ? (
        <div className="emptyState">
          <p>No appointment slots are available yet. Please check again soon.</p>
        </div>
      ) : (
        <div className="slotGrid">
          {slots.map((slot: DoctorSlot) => (
            <SlotCard key={slot.id} {...slot} />
          ))}
        </div>
      )}
    </section>
  );
}
