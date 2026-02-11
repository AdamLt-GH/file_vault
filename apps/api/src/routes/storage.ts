import { Router } from "express";

import { storageSummary } from "../controllers/storage-summary.js";
import { requireAuthentication } from "../middleware/require-authentication.js";

export const storageRouter = Router();

storageRouter.get("/summary", requireAuthentication, storageSummary);
