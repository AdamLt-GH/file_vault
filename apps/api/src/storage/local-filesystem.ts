import { createReadStream, createWriteStream } from "node:fs";
import { access, mkdir, rename, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { type Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";

import { StorageError } from "./storage-provider.js";

const storageKeyPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class LocalFilesystemStorage {
  private readonly filesDirectory: string;

  constructor(storageDirectory: string) {
    this.filesDirectory = resolve(storageDirectory, "files");
  }

  async save(input: NodeJS.ReadableStream, storageKey: string): Promise<void> {
    const finalPath = this.getStoragePath(storageKey);
    const temporaryPath = `${finalPath}.uploading-${randomUUID()}`;

    await mkdir(this.filesDirectory, { recursive: true });

    try {
      await pipeline(
        input as Readable,
        createWriteStream(temporaryPath, { flags: "wx" }),
      );
      await rename(temporaryPath, finalPath);
    } catch (error) {
      await rm(temporaryPath, { force: true });
      throw new StorageError("The file could not be saved", "WRITE_FAILED", {
        cause: error,
      });
    }
  }

  async open(storageKey: string): Promise<Readable> {
    const storagePath = this.getStoragePath(storageKey);

    try {
      await access(storagePath);
    } catch {
      throw new StorageError("The stored file does not exist", "NOT_FOUND");
    }

    return createReadStream(storagePath);
  }

  private getStoragePath(storageKey: string): string {
    if (!storageKeyPattern.test(storageKey)) {
      throw new StorageError("The storage key is not valid", "INVALID_KEY");
    }

    return resolve(this.filesDirectory, storageKey);
  }
}
