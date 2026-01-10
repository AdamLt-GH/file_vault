import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../src/app.js";
import type { Environment } from "../src/config/environment.js";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  createFile: vi.fn(),
}));

vi.mock("../src/services/auth.js", () => ({
  authenticateAdministrator: mocks.authenticate,
}));

vi.mock("../src/database/prisma.js", () => ({
  prisma: {
    adminUser: { findUnique: vi.fn() },
    storedFile: { create: mocks.createFile },
  },
}));

describe("file uploads", () => {
  let storageDirectory: string;
  let environment: Environment;

  beforeEach(async () => {
    vi.clearAllMocks();
    storageDirectory = await mkdtemp(join(tmpdir(), "file-vault-upload-"));
    environment = {
      API_PORT: 3000,
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      FILEVAULT_ADMIN_EMAIL: "admin@example.com",
      FILEVAULT_ADMIN_PASSWORD: "test-password-only",
      FILEVAULT_STORAGE_PATH: storageDirectory,
      MAX_UPLOAD_SIZE_MB: 10,
      NODE_ENV: "test",
      SESSION_SECRET: "test-session-secret-with-at-least-32-characters",
      SESSION_TTL_HOURS: 24,
      WEB_ORIGIN: "http://localhost:5173",
    };
    mocks.authenticate.mockResolvedValue({
      id: "1d72a054-5926-494d-84fc-927bd01546a0",
      email: "admin@example.com",
    });
  });

  afterEach(async () => {
    await rm(storageDirectory, { force: true, recursive: true });
  });

  it("stores the file and saves its metadata", async () => {
    mocks.createFile.mockImplementation(({ data }) => ({
      ...data,
      createdAt: new Date("2026-01-10T00:00:00.000Z"),
      folderId: null,
      id: "37bff070-71d7-4dc4-b074-bb14f7dcb1e7",
      updatedAt: new Date("2026-01-10T00:00:00.000Z"),
    }));

    const agent = request.agent(createApp(environment));
    await agent
      .post("/api/v1/auth/login")
      .send({ email: "admin@example.com", password: "correct-password" })
      .expect(200);

    const response = await agent
      .post("/api/v1/files/upload")
      .attach("file", Buffer.from("private notes"), {
        contentType: "text/plain",
        filename: "notes.txt",
      });

    expect(response.status).toBe(201);
    expect(response.body.file).toMatchObject({
      extension: "txt",
      mimeType: "text/plain",
      originalName: "notes.txt",
      sizeBytes: 13,
    });
    expect(mocks.createFile).toHaveBeenCalledWith({
      data: expect.objectContaining({
        checksum: expect.stringMatching(/^[a-f0-9]{64}$/),
        ownerId: "1d72a054-5926-494d-84fc-927bd01546a0",
        storageKey: expect.stringMatching(/^[a-f0-9-]{36}$/),
      }),
    });
    expect(await readdir(join(storageDirectory, "files"))).toHaveLength(1);
  });
});
