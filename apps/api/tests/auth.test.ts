import type { Request, Response } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../src/app.js";
import type { Environment } from "../src/config/environment.js";
import { requireAuthentication } from "../src/middleware/require-authentication.js";
import { authenticateAdministrator } from "../src/services/auth.js";

vi.mock("../src/services/auth.js", () => ({
  authenticateAdministrator: vi.fn(),
}));

vi.mock("../src/database/prisma.js", () => ({
  prisma: {
    adminUser: {
      findUnique: vi.fn(),
    },
  },
}));

const environment: Environment = {
  API_PORT: 3000,
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  FILEVAULT_ADMIN_EMAIL: "admin@example.com",
  FILEVAULT_ADMIN_PASSWORD: "test-password-only",
  NODE_ENV: "test",
  SESSION_SECRET: "test-session-secret-with-at-least-32-characters",
  SESSION_TTL_HOURS: 24,
  WEB_ORIGIN: "http://localhost:5173",
};

describe("authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs the administrator in and creates an HTTP-only cookie", async () => {
    vi.mocked(authenticateAdministrator).mockResolvedValue({
      id: "1d72a054-5926-494d-84fc-927bd01546a0",
      email: "admin@example.com",
    });

    const response = await request(createApp(environment))
      .post("/api/v1/auth/login")
      .send({ email: "ADMIN@example.com", password: "correct-password" });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("admin@example.com");
    expect(response.headers["set-cookie"]?.[0]).toContain("HttpOnly");
  });

  it("uses a general message when login fails", async () => {
    vi.mocked(authenticateAdministrator).mockResolvedValue(null);

    const response = await request(createApp(environment))
      .post("/api/v1/auth/login")
      .send({ email: "admin@example.com", password: "wrong-password" });

    expect(response.status).toBe(401);
    expect(response.body.error).toEqual({
      code: "INVALID_CREDENTIALS",
      message: "Email or password is incorrect",
    });
  });

  it("rejects protected requests without a session", () => {
    const requestValue = { session: {} } as Request;
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const responseValue = { status } as unknown as Response;
    const next = vi.fn();

    requireAuthentication(requestValue, responseValue, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: "UNAUTHENTICATED",
        message: "Log in to continue",
      },
    });
    expect(next).not.toHaveBeenCalled();
  });
});
