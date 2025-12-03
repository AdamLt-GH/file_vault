import { createServer } from "node:http";

import { createApp } from "./app.js";

const port = 3000;
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
