import { Router } from "express";

import type { Environment } from "../config/environment.js";
import {
  createUploadFileController,
  listFiles,
} from "../controllers/files.js";
import { requireAuthentication } from "../middleware/require-authentication.js";
import type { StorageProvider } from "../storage/storage-provider.js";

export function createFilesRouter(
  environment: Environment,
  storage: StorageProvider,
): Router {
  const router = Router();

  router.get("/", requireAuthentication, listFiles);

  router.post(
    "/upload",
    requireAuthentication,
    createUploadFileController({ environment, storage }),
  );

  return router;
}
