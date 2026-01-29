import { Router } from "express";

import {
  getBreadcrumbs,
  getFolders,
  patchFolder,
  postFolder,
  removeFolder,
} from "../controllers/folders.js";
import { requireAuthentication } from "../middleware/require-authentication.js";

export const foldersRouter = Router();

foldersRouter.get("/", requireAuthentication, getFolders);
foldersRouter.get("/:id/breadcrumbs", requireAuthentication, getBreadcrumbs);
foldersRouter.post("/", requireAuthentication, postFolder);
foldersRouter.patch("/:id", requireAuthentication, patchFolder);
foldersRouter.delete("/:id", requireAuthentication, removeFolder);
