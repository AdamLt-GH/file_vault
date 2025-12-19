import { Router } from "express";

import { login } from "../controllers/auth.js";

export const authRouter = Router();

authRouter.post("/login", login);

