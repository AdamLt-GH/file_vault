import { rateLimit } from "express-rate-limit";

export const loginRateLimit = rateLimit({
  legacyHeaders: false,
  limit: 5,
  message: {
    error: {
      code: "TOO_MANY_LOGIN_ATTEMPTS",
      message: "Too many login attempts. Try again in 15 minutes",
    },
  },
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  windowMs: 15 * 60 * 1000,
});

