import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";

import type { Environment } from "./config/environment.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { createSessionMiddleware } from "./middleware/session.js";
import { authRouter } from "./routes/auth.js";
import { createFilesRouter } from "./routes/files.js";
import { foldersRouter } from "./routes/folders.js";
import { healthRouter } from "./routes/health.js";
import { searchRouter } from "./routes/search.js";
import { storageRouter } from "./routes/storage.js";
import { createStorageProvider } from "./storage/index.js";

export function createApp(environment: Environment): Express {
  const app = express();
  const storage = createStorageProvider(environment);

  app.disable("x-powered-by");

  if (environment.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(
    cors({
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      origin: environment.WEB_ORIGIN,
    }),
  );
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(createSessionMiddleware(environment));

  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/files", createFilesRouter(environment, storage));
  app.use("/api/v1/folders", foldersRouter);
  app.use("/api/v1/search", searchRouter);
  app.use("/api/v1/storage", storageRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
