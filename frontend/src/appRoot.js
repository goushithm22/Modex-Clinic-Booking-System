import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
function NavigationBar() {
    const location = useLocation();
    const currentPath = location.pathname;
    /**
     * Determines whether a link is currently active based on its path.
     *
     * @param {string} path Route path to test.
     * @returns {boolean} True if the route is active; otherwise false.
     */
    const isActive = (path) => currentPath === path;
    return (_jsxs("header", { className: "appHeader", children: [_jsxs("div", { className: "appLogo", children: [_jsx("span", { className: "logoDot" }), _jsx("span", { className: "logoText", children: "Modex Clinic Booking" })] }), _jsxs("nav", { className: "appNav", children: [_jsx(Link, { to: "/", className: `navLink ${isActive("/") ? "navLinkActive" : ""}`, children: "Patient view" }), _jsx(Link, { to: "/admin", className: `navLink ${isActive("/admin") ? "navLinkActive" : ""}`, children: "Admin dashboard" })] })] }));
}
/**
 * Root component that wraps the navigation bar, banners, and app routes.
 * Uses global context for error and loading states.
 *
 * @returns {JSX.Element} Root application component.
 */
export function AppRoot() {
    const { errorMessage, clearErrorMessage, isLoading } = useAppContext();
    return (_jsxs("div", { className: "appShell", children: [_jsx(NavigationBar, {}), errorMessage !== null && (_jsxs("div", { className: "errorBanner", children: [_jsx("span", { children: errorMessage }), _jsx("button", { type: "button", className: "bannerButton", onClick: clearErrorMessage, children: "Dismiss" })] })), isLoading && (_jsx("div", { className: "loadingBanner", children: _jsx("span", { children: "Loading data..." }) })), _jsx("main", { className: "appMain", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(SlotListPage, {}) }), _jsx(Route, { path: "/booking/:slotId", element: _jsx(BookingPage, {}) }), _jsx(Route, { path: "/admin", element: _jsx(AdminDashboardPage, {}) })] }) })] }));
}
