import { Router } from "express";

import { getFolders, postFolder } from "../controllers/folders.js";
import { requireAuthentication } from "../middleware/require-authentication.js";

export const foldersRouter = Router();

foldersRouter.get("/", requireAuthentication, getFolders);
foldersRouter.post("/", requireAuthentication, postFolder);

