import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { LocalFilesystemStorage } from "../src/storage/local-filesystem.js";
import { StorageError } from "../src/storage/storage-provider.js";

const storageKey = "7d8a92e8-91f5-4d39-83be-77f5c9810412";

describe("local filesystem storage", () => {
  let temporaryDirectory: string;
  let storage: LocalFilesystemStorage;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), "file-vault-storage-"));
    storage = new LocalFilesystemStorage(temporaryDirectory);
  });

  afterEach(async () => {
    await rm(temporaryDirectory, { force: true, recursive: true });
  });

  it("streams a file into storage and opens it again", async () => {
    await storage.save(Readable.from("private file contents"), storageKey);

    expect(await storage.exists(storageKey)).toBe(true);

    const chunks: Buffer[] = [];
    for await (const chunk of await storage.open(storageKey)) {
      chunks.push(Buffer.from(chunk));
    }

    expect(Buffer.concat(chunks).toString()).toBe("private file contents");
  });

  it("deletes a stored file", async () => {
    await storage.save(Readable.from("delete me"), storageKey);
    await storage.delete(storageKey);

    expect(await storage.exists(storageKey)).toBe(false);
  });

  it("rejects storage keys that could change the filesystem path", async () => {
    await expect(storage.exists("../../private-file")).rejects.toMatchObject({
      code: "INVALID_KEY",
    } satisfies Partial<StorageError>);
  });
});
