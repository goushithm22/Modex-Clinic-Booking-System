/**
 * @file index.ts
 * @description Application entry point. Starts the HTTP server.
 */

import { createServer, Server } from "http";
import { createApp } from "./app";
import { loadConfig } from "./config/env";

/**
 * Starts the HTTP server on the configured port.
 */
function main(): void {
  const config = loadConfig();

  const app = createApp();
  const server: Server = createServer(app);

  server.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(
      `Server is listening on port ${config.port}.`
    );
  });
}

main();
