import { Router } from "express";

import { getSession, login, logout } from "../controllers/auth.js";

export const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/session", getSession);
