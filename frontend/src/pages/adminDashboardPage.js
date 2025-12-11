import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/// <reference types="react" />
/**
 * @file adminDashboardPage.tsx
 * @description Admin dashboard to create doctors and slots and view current slots.
 */
import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../appContext";
import { createDoctorApi, createSlotApi, getDoctorsApi, updateSlotCapacityApi, deleteSlotApi, deleteDoctorApi } from "../apiClient";
export function AdminDashboardPage() {
    const { apiBaseUrl, slots, refreshSlots } = useAppContext();
    const [doctorForm, setDoctorForm] = useState({
        name: "",
        specialization: ""
    });
    const [slotForm, setSlotForm] = useState({
        doctorId: "",
        startTime: "",
        endTime: "",
        capacity: 1
    });
    const [feedbackMessage, setFeedbackMessage] = useState(null);
    // Persisted doctor list fetched from backend.
    const [doctorList, setDoctorList] = useState([]);
    // For inline editing of a slot's capacity:
    const [editingSlotId, setEditingSlotId] = useState(null);
    const [editingCapacity, setEditingCapacity] = useState(1);
    const [isSavingCapacity, setIsSavingCapacity] = useState(false);
    // For delete confirmation dialogs
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    // Load persisted doctors on mount
    useEffect(() => {
        async function loadDoctors() {
            try {
                const remote = await getDoctorsApi(apiBaseUrl);
                const mapped = remote.map((d) => ({
                    id: d.id,
                    name: d.name,
                    specialization: d.specialization
                }));
                setDoctorList(mapped);
            }
            catch {
                // ignore for now
            }
        }
        void loadDoctors();
    }, [apiBaseUrl]);
    const handleDoctorInputChange = (event) => {
        const { name, value } = event.target;
        setDoctorForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };
    const handleSlotInputChange = (event) => {
        const { name, value } = event.target;
        if (name === "capacity") {
            const numericValue = Number(value);
            setSlotForm((previous) => ({
                ...previous,
                capacity: Number.isNaN(numericValue) ? 1 : numericValue
            }));
        }
        else {
            setSlotForm((previous) => ({
                ...previous,
                [name]: value
            }));
        }
    };
    const handleCreateDoctor = async (event) => {
        event.preventDefault();
        const trimmedName = doctorForm.name.trim();
        const trimmedSpecialization = doctorForm.specialization.trim();
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
            }
            catch {
                /* fallback ignored */
            }
            setDoctorForm({
                name: "",
                specialization: ""
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to create doctor.";
            setFeedbackMessage(message);
        }
    };
    const handleCreateSlot = async (event) => {
        event.preventDefault();
        const trimmedDoctorId = slotForm.doctorId.trim();
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
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to create slot.";
            setFeedbackMessage(message);
        }
    };
    // Ref to store the current timeout id for clearing feedback message
    const copyTimeoutRef = useRef(null);
    /**
     * Copies the provided text to clipboard. Falls back to textarea method if
     * navigator.clipboard is unavailable. Shows brief feedback message on success.
     *
     * @param text Text to copy to clipboard.
     */
    async function copyToClipboard(text) {
        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
                await navigator.clipboard.writeText(text);
            }
            else {
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
        }
        catch {
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
    function handleCopyId(id) {
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
    function startEditCapacity(slot) {
        setEditingSlotId(slot.id);
        setEditingCapacity(slot.capacity);
        setFeedbackMessage(null);
    }
    function cancelEditCapacity() {
        setEditingSlotId(null);
        setEditingCapacity(1);
    }
    async function saveCapacity(slotId) {
        setIsSavingCapacity(true);
        setFeedbackMessage(null);
        try {
            await updateSlotCapacityApi(apiBaseUrl, slotId, editingCapacity);
            setFeedbackMessage("Slot capacity updated.");
            setEditingSlotId(null);
            setEditingCapacity(1);
            await refreshSlots();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update slot capacity.";
            setFeedbackMessage(message);
        }
        finally {
            setIsSavingCapacity(false);
        }
    }
    /**
     * Initiates delete confirmation for a doctor.
     */
    function initiateDeleteDoctor(doctorId, doctorName) {
        setDeleteConfirm({ type: "doctor", id: doctorId, name: doctorName });
    }
    /**
     * Initiates delete confirmation for a slot.
     */
    function initiateDeleteSlot(slotId, slotName) {
        setDeleteConfirm({ type: "slot", id: slotId, name: slotName });
    }
    /**
     * Confirms and executes deletion of doctor or slot.
     */
    async function confirmDelete() {
        if (deleteConfirm === null)
            return;
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
            }
            else if (deleteConfirm.type === "slot") {
                await deleteSlotApi(apiBaseUrl, deleteConfirm.id);
                setFeedbackMessage("Slot deleted successfully.");
                await refreshSlots();
            }
            setDeleteConfirm(null);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete.";
            setFeedbackMessage(message);
        }
        finally {
            setIsDeleting(false);
        }
    }
    /**
     * Cancels the delete confirmation dialog.
     */
    function cancelDelete() {
        setDeleteConfirm(null);
    }
    return (_jsxs("section", { className: "pageContainer", children: [_jsx("header", { className: "pageHeader", children: _jsx("h1", { children: "Admin dashboard" }) }), feedbackMessage !== null && (_jsx("p", { className: "infoMessage", children: feedbackMessage })), _jsxs("div", { className: "adminGrid", children: [_jsxs("form", { className: "adminCard", onSubmit: handleCreateDoctor, children: [_jsx("h2", { children: "Create doctor" }), _jsx("label", { className: "formLabel", htmlFor: "doctorName", children: "Name" }), _jsx("input", { id: "doctorName", name: "name", type: "text", className: "formInput", value: doctorForm.name, onChange: handleDoctorInputChange, placeholder: "Dr. John Doe" }), _jsx("label", { className: "formLabel", htmlFor: "doctorSpecialization", children: "Specialization" }), _jsx("input", { id: "doctorSpecialization", name: "specialization", type: "text", className: "formInput", value: doctorForm.specialization, onChange: handleDoctorInputChange, placeholder: "Cardiologist" }), _jsx("button", { type: "submit", className: "primaryButton", children: "Create doctor" })] }), _jsxs("form", { className: "adminCard", onSubmit: handleCreateSlot, children: [_jsx("h2", { children: "Create slot" }), _jsx("label", { className: "formLabel", htmlFor: "slotDoctorId", children: "Doctor ID" }), _jsx("input", { id: "slotDoctorId", name: "doctorId", type: "text", className: "formInput", value: slotForm.doctorId, onChange: handleSlotInputChange, placeholder: "Paste doctor ID here" }), _jsx("label", { className: "formLabel", htmlFor: "slotStartTime", children: "Start time" }), _jsx("input", { id: "slotStartTime", name: "startTime", type: "datetime-local", className: "formInput", value: slotForm.startTime, onChange: handleSlotInputChange }), _jsx("label", { className: "formLabel", htmlFor: "slotEndTime", children: "End time" }), _jsx("input", { id: "slotEndTime", name: "endTime", type: "datetime-local", className: "formInput", value: slotForm.endTime, onChange: handleSlotInputChange }), _jsx("label", { className: "formLabel", htmlFor: "slotCapacity", children: "Capacity" }), _jsx("input", { id: "slotCapacity", name: "capacity", type: "number", min: 1, className: "formInput", value: slotForm.capacity, onChange: handleSlotInputChange }), _jsx("button", { type: "submit", className: "primaryButton", children: "Create slot" })] })] }), _jsxs("section", { className: "adminCard adminTableCard", children: [_jsx("h2", { children: "Recently created doctors" }), doctorList.length === 0 ? (_jsx("p", { className: "emptyStateText", children: "No doctors found." })) : (_jsx("div", { className: "tableWrapper", children: _jsxs("table", { className: "slotTable", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Name" }), _jsx("th", { children: "Specialization" }), _jsx("th", { children: "Doctor ID" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: doctorList.map((doctor) => (_jsxs("tr", { children: [_jsxs("td", { children: ["Dr. ", doctor.name] }), _jsx("td", { children: doctor.specialization }), _jsx("td", { children: _jsx("span", { className: "idChip idChipClickable", role: "button", tabIndex: 0, title: "Click to copy ID", onClick: () => handleCopyId(doctor.id), onKeyDown: (e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            // space/enter triggers copy
                                                            e.preventDefault();
                                                            handleCopyId(doctor.id);
                                                        }
                                                    }, "aria-label": `Copy doctor id ${doctor.id}`, children: doctor.id }) }), _jsx("td", { children: _jsx("button", { type: "button", className: "dangerButton", onClick: () => initiateDeleteDoctor(doctor.id, doctor.name), children: "Delete" }) })] }, doctor.id))) })] }) }))] }), _jsxs("section", { className: "adminCard adminTableCard", children: [_jsx("h2", { children: "Current slots" }), slots.length === 0 ? (_jsx("p", { className: "emptyStateText", children: "No slots have been created yet." })) : (_jsx("div", { className: "tableWrapper", children: _jsxs("table", { className: "slotTable", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Doctor" }), _jsx("th", { children: "Specialization" }), _jsx("th", { children: "Time" }), _jsx("th", { children: "Capacity" }), _jsx("th", { children: "Booked" }), _jsx("th", { children: "Available" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: slots.map((slot) => {
                                        const readableTime = new Date(slot.startTime).toLocaleString();
                                        const isEditing = editingSlotId === slot.id;
                                        return (_jsxs("tr", { children: [_jsx("td", { children: slot.doctorName }), _jsx("td", { children: slot.doctorSpecialization }), _jsx("td", { children: readableTime }), _jsx("td", { children: isEditing ? (_jsx("input", { type: "number", min: 0, className: "formInput", value: editingCapacity, onChange: (e) => {
                                                            const v = Number(e.target.value);
                                                            setEditingCapacity(Number.isNaN(v) ? 0 : v);
                                                        } })) : (slot.capacity) }), _jsx("td", { children: slot.confirmedCount }), _jsx("td", { children: slot.availableSeats }), _jsx("td", { children: isEditing ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "primaryButton", onClick: () => void saveCapacity(slot.id), disabled: isSavingCapacity, children: isSavingCapacity ? "Saving..." : "Save" }), _jsx("button", { type: "button", className: "secondaryButton", onClick: cancelEditCapacity, style: { marginLeft: "0.4rem" }, children: "Cancel" })] })) : (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "secondaryButton", onClick: () => startEditCapacity(slot), children: "Edit capacity" }), _jsx("button", { type: "button", className: "dangerButton", onClick: () => initiateDeleteSlot(slot.id, `${slot.doctorName}'s slot`), style: { marginLeft: "0.4rem" }, children: "Delete" })] })) })] }, slot.id));
                                    }) })] }) }))] }), _jsxs("section", { className: "adminCard adminTableCard", children: [_jsx("h2", { children: "Recent bookings" }), slots.flatMap(s => (s.bookings ?? []).map(b => ({ slot: s, booking: b }))).length === 0 ? (_jsx("p", { className: "emptyStateText", children: "No bookings yet." })) : (_jsx("div", { className: "tableWrapper", children: _jsxs("table", { className: "slotTable", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Doctor" }), _jsx("th", { children: "Time" }), _jsx("th", { children: "Patient" }), _jsx("th", { children: "Booked At" })] }) }), _jsx("tbody", { children: slots.flatMap((s) => (s.bookings ?? []).map((b) => (_jsxs("tr", { children: [_jsx("td", { children: s.doctorName }), _jsx("td", { children: new Date(s.startTime).toLocaleString() }), _jsx("td", { children: b.userName }), _jsx("td", { children: new Date(b.createdAt).toLocaleString() })] }, b.id)))) })] }) }))] }), deleteConfirm !== null && (_jsx("div", { className: "confirmationOverlay", children: _jsxs("div", { className: "confirmationDialog", children: [_jsx("h3", { children: "Confirm deletion" }), _jsxs("p", { children: ["Are you sure you want to delete ", _jsx("strong", { children: deleteConfirm.name }), "?", deleteConfirm.type === "doctor" && " All associated slots will remain but will be orphaned."] }), _jsxs("div", { className: "confirmationActions", children: [_jsx("button", { type: "button", className: "secondaryButton", onClick: cancelDelete, children: "Cancel" }), _jsx("button", { type: "button", className: "dangerButton", onClick: () => void confirmDelete(), disabled: isDeleting, children: isDeleting ? "Deleting..." : "Delete" })] })] }) }))] }));
}
