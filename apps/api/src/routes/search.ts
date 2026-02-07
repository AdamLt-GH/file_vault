import { Router } from "express";

import { search } from "../controllers/search.js";
import { requireAuthentication } from "../middleware/require-authentication.js";

export const searchRouter = Router();

searchRouter.get("/", requireAuthentication, search);

