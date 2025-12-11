import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/// <reference types="react" />
/**
 * @file slotListPage.tsx
 * @description Patient-facing page displaying available doctor slots.
 */
import { Link } from "react-router-dom";
import { useAppContext } from "../appContext";
/**
 * Card displaying summary details of a doctor slot.
 *
 * @param {DoctorSlot} slot Slot information to render.
 * @returns {JSX.Element} Slot card component.
 */
function SlotCard(slot) {
    const slotDate = new Date(slot.startTime);
    const readableDate = slotDate.toLocaleString();
    return (_jsxs("article", { className: "slotCard", children: [_jsxs("h2", { className: "slotTitle", children: ["Dr. ", slot.doctorName] }), _jsx("p", { className: "slotSubtitle", children: slot.doctorSpecialization }), _jsxs("p", { className: "slotDetail", children: [_jsx("span", { className: "slotLabel", children: "Time:" }), " ", readableDate] }), _jsxs("p", { className: "slotDetail", children: [_jsx("span", { className: "slotLabel", children: "Capacity:" }), " ", slot.capacity] }), _jsxs("p", { className: "slotDetail", children: [_jsx("span", { className: "slotLabel", children: "Available:" }), " ", slot.availableSeats] }), _jsx("div", { className: "slotActions", children: _jsx(Link, { to: `/booking/${slot.id}`, className: `primaryButton ${slot.availableSeats <= 0 ? "buttonDisabled" : ""}`, children: slot.availableSeats > 0 ? "Book appointment" : "Fully booked" }) })] }));
}
/**
 * Page component that lists all available slots for patients.
 *
 * @returns {JSX.Element} Slot list page.
 */
export function SlotListPage() {
    const { slots } = useAppContext();
    return (_jsxs("section", { className: "pageContainer", children: [_jsxs("header", { className: "pageHeader", children: [_jsx("h1", { children: "Available appointments" }), _jsx("p", { children: "Choose a doctor and time that works best for you. Booking is instant and respects real-time capacity from the backend." })] }), slots.length === 0 ? (_jsx("div", { className: "emptyState", children: _jsx("p", { children: "No appointment slots are available yet. Please check again soon." }) })) : (_jsx("div", { className: "slotGrid", children: slots.map((slot) => (_jsx(SlotCard, { ...slot }, slot.id))) }))] }));
}
