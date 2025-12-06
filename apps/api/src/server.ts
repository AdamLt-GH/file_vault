import { createServer } from "node:http";

import { createApp } from "./app.js";
import { loadEnvironment } from "./config/environment.js";

const environment = loadEnvironment();
const port = environment.API_PORT;
const app = createApp();
const server = createServer(app);

server.listen(port, () => {
  console.log(`File Vault API is running on port ${port}`);
});

function stopServer(signal: NodeJS.Signals): void {
  console.log(`${signal} received, closing the API`);

  server.close((error) => {
    if (error) {
      console.error("The API could not close cleanly", error);
      process.exit(1);
    }

    process.exit(0);
  });
}

process.on("SIGINT", stopServer);
process.on("SIGTERM", stopServer);
