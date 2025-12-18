import { createServer } from "node:http";

import { createApp } from "./app.js";
import { loadEnvironment } from "./config/environment.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./database/prisma.js";
import { bootstrapAdministrator } from "./services/admin-bootstrap.js";

const environment = loadEnvironment();
const port = environment.API_PORT;
const app = createApp(environment);
const server = createServer(app);

async function startApi(): Promise<void> {
  await connectDatabase();
  await bootstrapAdministrator(environment);

  server.listen(port, () => {
    console.log(`File Vault API is running on port ${port}`);
  });
}

function stopServer(signal: NodeJS.Signals): void {
  console.log(`${signal} received, closing the API`);

  server.close(async (error) => {
    if (error) {
      console.error("The API could not close cleanly", error);
      process.exit(1);
    }

    await disconnectDatabase();
    process.exit(0);
  });
}

process.on("SIGINT", stopServer);
process.on("SIGTERM", stopServer);

startApi().catch(async (error: unknown) => {
  console.error("The API could not start", error);
  await disconnectDatabase();
  process.exit(1);
});
