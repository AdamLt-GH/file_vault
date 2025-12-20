import { Router } from "express";

import { getSession, login } from "../controllers/auth.js";

export const authRouter = Router();

authRouter.post("/login", login);
authRouter.get("/session", getSession);
