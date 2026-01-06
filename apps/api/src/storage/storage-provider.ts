import type { Readable } from "node:stream";

export interface StorageProvider {
  save(input: NodeJS.ReadableStream, storageKey: string): Promise<void>;
  open(storageKey: string): Promise<Readable>;
  delete(storageKey: string): Promise<void>;
  exists(storageKey: string): Promise<boolean>;
}

export class StorageError extends Error {
  constructor(
    message: string,
    readonly code: "INVALID_KEY" | "NOT_FOUND" | "WRITE_FAILED",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "StorageError";
  }
}
