import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @file mainEntry.tsx
 * @description Application entry file that mounts the React app into the DOM.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppContextProvider } from "./appContext";
import { AppRoot } from "./appRoot";
import "./appStyles.css";
/**
 * Bootstraps the React application by rendering the root component
 * inside the HTML element with id "root".
 *
 * This function:
 * - Locates the root HTML element.
 * - Creates a React root.
 * - Wraps the application with:
 *   - React.StrictMode for extra checks.
 *   - AppContextProvider for global state.
 *   - BrowserRouter for client-side routing.
 */
function bootstrap() {
    // Safely locate the root element.
    const rootElement = document.getElementById("root");
    // If the root element is not present, the app cannot start.
    if (rootElement === null) {
        throw new Error("Root element with id \"root\" not found in index.html.");
    }
    // Create a React 18 root for concurrent rendering.
    const reactRoot = ReactDOM.createRoot(rootElement);
    // Render the application tree with all providers.
    reactRoot.render(_jsx(React.StrictMode, { children: _jsx(AppContextProvider, { children: _jsx(BrowserRouter, { children: _jsx(AppRoot, {}) }) }) }));
}
// Start the application.
bootstrap();
