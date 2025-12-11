import { jsx as _jsx } from "react/jsx-runtime";
/// <reference types="react" />
/**
 * @file appContext.tsx
 * @description React context that stores global application state such as
 * appointment slots, loading state, error handling, and backend API URL.
 */
import React, { createContext, useCallback, useEffect, useState } from "react";
import { getSlots } from "./apiClient";
const AppContext = createContext(undefined);
/**
 * Provides global application state & API helpers.
 * Includes:
 * - API base URL
 * - Slot list
 * - Loading indicator
 * - Error messages
 * - Method to refresh slots from API
 */
export function AppContextProvider(props) {
    const [apiBaseUrl] = useState("http://localhost:4000/api");
    const [slots, setSlots] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    /**
     * Clears current error if exists.
     */
    const clearErrorMessage = useCallback(() => {
        setErrorMessage(null);
    }, []);
    /**
     * Fetches latest slot list from backend API.
     */
    const refreshSlots = useCallback(async () => {
        try {
            setIsLoading(true);
            clearErrorMessage();
            const fetchedSlots = await getSlots(apiBaseUrl);
            setSlots(fetchedSlots);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error fetching slots.";
            setErrorMessage(message);
        }
        finally {
            setIsLoading(false);
        }
    }, [apiBaseUrl, clearErrorMessage]);
    /**
     * On initial load → fetch slot data.
     */
    useEffect(() => {
        void refreshSlots();
    }, [refreshSlots]);
    /**
     * Periodically refresh slots to keep UI in sync with concurrent bookings.
     * Also refresh when the window gains focus to improve perceived freshness.
     */
    useEffect(() => {
        const interval = setInterval(() => {
            void refreshSlots();
        }, 5000);
        const onFocus = () => {
            void refreshSlots();
        };
        window.addEventListener("focus", onFocus);
        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", onFocus);
        };
    }, [refreshSlots]);
    const value = {
        apiBaseUrl,
        slots,
        isLoading,
        errorMessage,
        refreshSlots,
        clearErrorMessage
    };
    return _jsx(AppContext.Provider, { value: value, children: props.children });
}
/**
 * Hook to consume the global context safely.
 */
export function useAppContext() {
    const value = React.useContext(AppContext);
    if (value === undefined) {
        throw new Error("useAppContext must be used inside AppContextProvider.");
    }
    return value;
}
