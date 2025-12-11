/// <reference types="react" />
/**
 * @file appContext.tsx
 * @description React context that stores global application state such as
 * appointment slots, loading state, error handling, and backend API URL.
 */

import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
  ReactNode
} from "react";
import { getSlots } from "./apiClient";

/**
 * Slot information returned from backend API.
 */
export interface DoctorSlot {
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


/**
 * Type for context value shared across application.
 */
interface AppContextValue {
  readonly apiBaseUrl: string;
  readonly slots: readonly DoctorSlot[];
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly refreshSlots: () => Promise<void>;
  readonly clearErrorMessage: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

interface AppContextProviderProps {
  readonly children: ReactNode;
}

/**
 * Provides global application state & API helpers.
 * Includes:
 * - API base URL
 * - Slot list
 * - Loading indicator
 * - Error messages
 * - Method to refresh slots from API
 */
export function AppContextProvider(
  props: AppContextProviderProps
): React.ReactElement {
  const [apiBaseUrl] = useState<string>("http://localhost:4000/api");
  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Clears current error if exists.
   */
  const clearErrorMessage = useCallback((): void => {
    setErrorMessage(null);
  }, []);

  /**
   * Fetches latest slot list from backend API.
   */
  const refreshSlots = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      clearErrorMessage();
      const fetchedSlots: DoctorSlot[] = await getSlots(apiBaseUrl);
      setSlots(fetchedSlots);
    } catch (error) {
      const message: string =
        error instanceof Error ? error.message : "Unknown error fetching slots.";
      setErrorMessage(message);
    } finally {
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

    const onFocus = (): void => {
      void refreshSlots();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshSlots]);

  const value: AppContextValue = {
    apiBaseUrl,
    slots,
    isLoading,
    errorMessage,
    refreshSlots,
    clearErrorMessage
  };

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
}

/**
 * Hook to consume the global context safely.
 */
export function useAppContext(): AppContextValue {
  const value = React.useContext(AppContext);
  if (value === undefined) {
    throw new Error("useAppContext must be used inside AppContextProvider.");
  }
  return value;
}
