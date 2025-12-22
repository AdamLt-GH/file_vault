import { Router } from "express";

import { getSession, login, logout } from "../controllers/auth.js";
import { loginRateLimit } from "../middleware/login-rate-limit.js";

export const authRouter = Router();

authRouter.post("/login", loginRateLimit, login);
authRouter.post("/logout", logout);
authRouter.get("/session", getSession);
