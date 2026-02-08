import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../src/app.js";
import type { Environment } from "../src/config/environment.js";
import { LocalFilesystemStorage } from "../src/storage/local-filesystem.js";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  countFiles: vi.fn(),
  createFile: vi.fn(),
  deleteMany: vi.fn(),
  findFiles: vi.fn(),
  findOwnedFile: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("../src/services/auth.js", () => ({
  authenticateAdministrator: mocks.authenticate,
}));

vi.mock("../src/database/prisma.js", () => ({
  prisma: {
    adminUser: { findUnique: vi.fn() },
    storedFile: {
      count: mocks.countFiles,
      create: mocks.createFile,
      findFirst: mocks.findOwnedFile,
      findMany: mocks.findFiles,
    },
    $transaction: mocks.transaction,
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
    mocks.countFiles.mockResolvedValue(1);
    mocks.transaction.mockImplementation(async (work) => {
      if (Array.isArray(work)) return Promise.all(work);

      return work({ storedFile: { deleteMany: mocks.deleteMany } });
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

  it("rejects unsupported file types before metadata is saved", async () => {
    const agent = request.agent(createApp(environment));
    await agent
      .post("/api/v1/auth/login")
      .send({ email: "admin@example.com", password: "correct-password" })
      .expect(200);

    const response = await agent
      .post("/api/v1/files/upload")
      .attach("file", Buffer.from("not allowed"), {
        contentType: "application/octet-stream",
        filename: "program.exe",
      });

    expect(response.status).toBe(415);
    expect(response.body.error.code).toBe("UNSUPPORTED_FILE_TYPE");
    expect(mocks.createFile).not.toHaveBeenCalled();
  });

  it("removes a partial file when the upload is too large", async () => {
    environment.MAX_UPLOAD_SIZE_MB = 1;
    const agent = request.agent(createApp(environment));
    await agent
      .post("/api/v1/auth/login")
      .send({ email: "admin@example.com", password: "correct-password" })
      .expect(200);

    const response = await agent
      .post("/api/v1/files/upload")
      .attach("file", Buffer.alloc(1024 * 1024 + 1, "a"), {
        contentType: "text/plain",
        filename: "too-large.txt",
      });

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe("FILE_TOO_LARGE");
    expect(mocks.createFile).not.toHaveBeenCalled();
    expect(await readdir(join(storageDirectory, "files"))).toHaveLength(0);
  });

  it("lists files from the current folder", async () => {
    mocks.findFiles.mockResolvedValue([
      {
        checksum: "a".repeat(64),
        createdAt: new Date("2026-01-16T00:00:00.000Z"),
        extension: "txt",
        folderId: null,
        id: "37bff070-71d7-4dc4-b074-bb14f7dcb1e7",
        mimeType: "text/plain",
        originalName: "notes.txt",
        ownerId: "1d72a054-5926-494d-84fc-927bd01546a0",
        sizeBytes: 13n,
        storageKey: "7d8a92e8-91f5-4d39-83be-77f5c9810412",
        updatedAt: new Date("2026-01-16T00:00:00.000Z"),
      },
    ]);

    const agent = await createLoggedInAgent(environment);
    const response = await agent.get("/api/v1/files");

    expect(response.status).toBe(200);
    expect(response.body.files[0]).toMatchObject({
      originalName: "notes.txt",
      sizeBytes: 13,
    });
    expect(response.body).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it("streams an owned file using its display name", async () => {
    const storageKey = "7d8a92e8-91f5-4d39-83be-77f5c9810412";
    await new LocalFilesystemStorage(storageDirectory).save(
      Readable.from("download contents"),
      storageKey,
    );
    mocks.findOwnedFile.mockResolvedValue({
      mimeType: "text/plain",
      originalName: "private notes.txt",
      ownerId: "1d72a054-5926-494d-84fc-927bd01546a0",
      sizeBytes: 17n,
      storageKey,
    });

    const agent = await createLoggedInAgent(environment);
    const response = await agent.get(
      "/api/v1/files/37bff070-71d7-4dc4-b074-bb14f7dcb1e7/download",
    );

    expect(response.status).toBe(200);
    expect(response.text).toBe("download contents");
    expect(response.headers["content-disposition"]).toContain(
      "private%20notes.txt",
    );
  });

  it("deletes owned file metadata and its stored contents", async () => {
    const storageKey = "7d8a92e8-91f5-4d39-83be-77f5c9810412";
    const storage = new LocalFilesystemStorage(storageDirectory);
    await storage.save(Readable.from("delete contents"), storageKey);
    mocks.findOwnedFile.mockResolvedValue({ storageKey });
    mocks.deleteMany.mockResolvedValue({ count: 1 });

    const agent = await createLoggedInAgent(environment);
    const response = await agent.delete(
      "/api/v1/files/37bff070-71d7-4dc4-b074-bb14f7dcb1e7",
    );

    expect(response.status).toBe(204);
    expect(await storage.exists(storageKey)).toBe(false);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "37bff070-71d7-4dc4-b074-bb14f7dcb1e7",
        ownerId: "1d72a054-5926-494d-84fc-927bd01546a0",
      },
    });
  });
});

async function createLoggedInAgent(environment: Environment) {
  const agent = request.agent(createApp(environment));
  await agent
    .post("/api/v1/auth/login")
    .send({ email: "admin@example.com", password: "correct-password" })
    .expect(200);
  return agent;
}
