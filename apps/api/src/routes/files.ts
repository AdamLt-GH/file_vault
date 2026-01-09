import { Router } from "express";

import type { Environment } from "../config/environment.js";
import { createUploadFileController } from "../controllers/files.js";
import { requireAuthentication } from "../middleware/require-authentication.js";
import type { StorageProvider } from "../storage/storage-provider.js";

export function createFilesRouter(
  environment: Environment,
  storage: StorageProvider,
): Router {
  const router = Router();

  router.post(
    "/upload",
    requireAuthentication,
    createUploadFileController({ environment, storage }),
  );

  return router;
}

