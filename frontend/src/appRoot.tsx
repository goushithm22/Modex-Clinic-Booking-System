/// <reference types="react" />
/**
 * @file appRoot.tsx
 * @description Root layout for the application, including navigation and routes.
 */
import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useAppContext } from "./appContext";
import { SlotListPage } from "./pages/slotListPage";
import { BookingPage } from "./pages/bookingPage";
import { AdminDashboardPage } from "./pages/adminDashboardPage";

/**
 * Navigation bar shown at the top of the application.
 * Highlights the active route and provides quick access
 * to patient and admin views.
 *
 * @returns {JSX.Element} Navigation bar component.
 */
function NavigationBar(): React.ReactElement {
  const location = useLocation();
  const currentPath: string = location.pathname;

  /**
   * Determines whether a link is currently active based on its path.
   *
   * @param {string} path Route path to test.
   * @returns {boolean} True if the route is active; otherwise false.
   */
  const isActive = (path: string): boolean => currentPath === path;

  return (
    <header className="appHeader">
      <div className="appLogo">
        <span className="logoDot" />
        <span className="logoText">Modex Clinic Booking</span>
      </div>
      <nav className="appNav">
        <Link
          to="/"
          className={`navLink ${isActive("/") ? "navLinkActive" : ""}`}
        >
          Patient view
        </Link>
        <Link
          to="/admin"
          className={`navLink ${isActive("/admin") ? "navLinkActive" : ""}`}
        >
          Admin dashboard
        </Link>
      </nav>
    </header>
  );
}

/**
 * Root component that wraps the navigation bar, banners, and app routes.
 * Uses global context for error and loading states.
 *
 * @returns {JSX.Element} Root application component.
 */
export function AppRoot(): React.ReactElement {
  const { errorMessage, clearErrorMessage, isLoading } = useAppContext();

  return (
    <div className="appShell">
      <NavigationBar />

      {errorMessage !== null && (
        <div className="errorBanner">
          <span>{errorMessage}</span>
          <button
            type="button"
            className="bannerButton"
            onClick={clearErrorMessage}
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoading && (
        <div className="loadingBanner">
          <span>Loading data...</span>
        </div>
      )}

      <main className="appMain">
        <Routes>
          <Route path="/" element={<SlotListPage />} />
          <Route path="/booking/:slotId" element={<BookingPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Routes>
      </main>
    </div>
  );
}
