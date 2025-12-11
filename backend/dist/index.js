"use strict";
/**
 * @file index.ts
 * @description Application entry point. Starts the HTTP server.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = require("./app");
const env_1 = require("./config/env");
/**
 * Starts the HTTP server on the configured port.
 */
function main() {
    const config = (0, env_1.loadConfig)();
    const app = (0, app_1.createApp)();
    const server = (0, http_1.createServer)(app);
    server.listen(config.port, () => {
        // eslint-disable-next-line no-console
        console.log(`Server is listening on port ${config.port}.`);
    });
}
main();
