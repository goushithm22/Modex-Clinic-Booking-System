import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/// <reference types="react" />
/**
 * @file bookingPage.tsx
 * @description Page for booking a single appointment slot.
 */
import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../appContext";
import { getSlotById, createBookingApi } from "../apiClient";
/**
 * Booking page component that loads a single slot and allows
 * the user to confirm a booking.
 *
 * @returns {JSX.Element} Booking page.
 */
export function BookingPage() {
    const routeParams = useParams();
    const navigate = useNavigate();
    const { apiBaseUrl, refreshSlots } = useAppContext();
    const [slot, setSlot] = useState(null);
    const [formState, setFormState] = useState({
        userName: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingMessage, setBookingMessage] = useState(null);
    // Stores the user's preferred time selected in the UI.
    const [preferredTime, setPreferredTime] = useState(null);
    const slotId = routeParams.slotId;
    /**
     * Loads slot details from the backend API based on route parameter.
     */
    useEffect(() => {
        async function loadSlot() {
            if (slotId === undefined) {
                setBookingMessage("Invalid slot identifier.");
                return;
            }
            try {
                const fetchedSlot = await getSlotById(apiBaseUrl, slotId);
                setSlot(fetchedSlot);
                // initialize preferred time to the slot startTime by default
                setPreferredTime(fetchedSlot.startTime);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Could not load appointment slot.";
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
    const handleInputChange = (event) => {
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
    const timeOptions = useMemo(() => {
        if (slot === null)
            return [];
        const startMs = new Date(slot.startTime).getTime();
        const endMs = new Date(slot.endTime).getTime();
        if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
            return [slot.startTime];
        }
        const count = Math.max(1, slot.capacity);
        if (count === 1)
            return [new Date(startMs).toISOString()];
        const interval = (endMs - startMs) / count;
        const opts = [];
        for (let i = 0; i < count; i++) {
            const t = new Date(Math.floor(startMs + interval * i));
            opts.push(t.toISOString());
        }
        return opts;
    }, [slot]);
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (slotId === undefined) {
            setBookingMessage("Invalid slot identifier.");
            return;
        }
        const trimmedName = formState.userName.trim();
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
            const chosenTimeNote = preferredTime !== null ? ` Preferred time: ${new Date(preferredTime).toLocaleString()}.` : "";
            setBookingMessage(`Booking confirmed successfully.${chosenTimeNote} Redirecting to home...`);
            // Short delay so the user can read the confirmation.
            setTimeout(() => {
                navigate("/");
            }, 1500);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to create booking.";
            // If another user just filled the slot, refresh the slot list so it disappears.
            if (message === "Slot is full.") {
                void refreshSlots();
            }
            setBookingMessage(message);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    if (slot === null) {
        return (_jsxs("section", { className: "pageContainer", children: [_jsx("header", { className: "pageHeader", children: _jsx("h1", { children: "Booking appointment" }) }), _jsx("p", { children: "Loading appointment details..." }), bookingMessage !== null && (_jsx("p", { className: "infoMessage", children: bookingMessage }))] }));
    }
    const readableTime = new Date(slot.startTime).toLocaleString();
    return (_jsxs("section", { className: "pageContainer", children: [_jsxs("header", { className: "pageHeader", children: [_jsx("h1", { children: "Confirm your appointment" }), _jsxs("p", { children: ["You are booking an appointment with Dr. ", slot.doctorName, " on", " ", readableTime, "."] })] }), _jsxs("article", { className: "slotCard slotCardWide", children: [_jsxs("p", { className: "slotDetail", children: [_jsx("span", { className: "slotLabel", children: "Doctor:" }), " Dr. ", slot.doctorName, " (", slot.doctorSpecialization, ")"] }), _jsxs("p", { className: "slotDetail", children: [_jsx("span", { className: "slotLabel", children: "Time:" }), " ", readableTime] }), _jsxs("p", { className: "slotDetail", children: [_jsx("span", { className: "slotLabel", children: "Available:" }), " ", slot.availableSeats] })] }), timeOptions.length > 0 && (_jsxs("fieldset", { className: "timeOptions", "aria-labelledby": "preferred-time-legend", children: [_jsx("legend", { id: "preferred-time-legend", className: "formLabel", children: "Preferred time" }), _jsx("div", { className: "timeOptionsList", children: timeOptions.map((opt) => (_jsxs("label", { className: "timeOption", children: [_jsx("input", { type: "radio", name: "preferredTime", value: opt, checked: preferredTime === opt, onChange: () => setPreferredTime(opt) }), _jsx("span", { className: "timeOptionLabel", children: new Date(opt).toLocaleString() })] }, opt))) }), _jsx("p", { className: "timeNote", children: "Selected time is a preference only; booking records the slot." })] })), _jsxs("form", { className: "bookingForm", onSubmit: handleSubmit, children: [_jsx("label", { className: "formLabel", htmlFor: "userName", children: "Your name" }), _jsx("input", { id: "userName", name: "userName", type: "text", className: "formInput", value: formState.userName, onChange: handleInputChange, placeholder: "Enter your full name" }), bookingMessage !== null && (_jsx("p", { className: "infoMessage", children: bookingMessage })), _jsxs("div", { className: "formActions", children: [_jsx(Link, { to: "/", className: "secondaryButton", children: "Cancel" }), _jsx("button", { type: "submit", className: "primaryButton", disabled: isSubmitting || slot.availableSeats <= 0, children: isSubmitting ? "Booking..." : "Confirm booking" })] })] })] }));
}
