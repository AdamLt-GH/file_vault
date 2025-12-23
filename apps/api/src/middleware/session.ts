import connectPgSimple from "connect-pg-simple";
import session from "express-session";

import type { Environment } from "../config/environment.js";

const PostgresSessionStore = connectPgSimple(session);

export function createSessionMiddleware(environment: Environment) {
  const store =
    environment.NODE_ENV === "test"
      ? undefined
      : new PostgresSessionStore({
          conString: environment.DATABASE_URL,
          createTableIfMissing: false,
          tableName: "user_sessions",
        });

  return session({
    cookie: {
      httpOnly: true,
      maxAge: environment.SESSION_TTL_HOURS * 60 * 60 * 1000,
      sameSite: "lax",
      secure: environment.NODE_ENV === "production",
    },
    name: "filevault.sid",
    resave: false,
    rolling: true,
    saveUninitialized: false,
    secret: environment.SESSION_SECRET,
    ...(store ? { store } : {}),
  });
}
