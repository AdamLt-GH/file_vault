import { createHash, randomUUID } from "node:crypto";
import { Transform, type TransformCallback } from "node:stream";
import { fileTypeFromStream } from "file-type";

import {
  getFileExtension,
  isAllowedMimeType,
  isSupportedExtension,
} from "../config/file-types.js";
import type { StorageProvider } from "../storage/storage-provider.js";
import type { IncomingUpload } from "./multipart.js";

export class UploadValidationError extends Error {
  constructor(
    message: string,
    readonly code: "INVALID_FILENAME" | "UNSUPPORTED_FILE_TYPE",
  ) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export interface StoredUpload {
  checksum: string;
  extension: string;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
  storageKey: string;
}

export async function storeUpload(
  upload: IncomingUpload,
  storage: StorageProvider,
): Promise<StoredUpload> {
  const originalName = validateUploadFilename(upload.info.filename);
  const extension = getFileExtension(originalName);

  if (!extension || !isSupportedExtension(extension)) {
    throw new UploadValidationError(
      "This file extension is not supported",
      "UNSUPPORTED_FILE_TYPE",
    );
  }

  if (!isAllowedMimeType(extension, upload.info.mimeType)) {
    throw new UploadValidationError(
      "The file type does not match its extension",
      "UNSUPPORTED_FILE_TYPE",
    );
  }

  const storageKey = randomUUID();
  const hash = createHash("sha256");
  let sizeBytes = 0;

  const checksumStream = new Transform({
    transform(chunk: Buffer, _encoding, callback: TransformCallback) {
      hash.update(chunk);
      sizeBytes += chunk.length;
      callback(null, chunk);
    },
  });

  upload.stream.once("error", (error) => checksumStream.destroy(error));
  upload.stream.pipe(checksumStream);
  await storage.save(checksumStream, storageKey);

  try {
    const storedStream = await storage.open(storageKey);

    try {
      const detectedType = await fileTypeFromStream(storedStream);

      if (detectedType && !isAllowedMimeType(extension, detectedType.mime)) {
        throw new UploadValidationError(
          "The file contents do not match its extension",
          "UNSUPPORTED_FILE_TYPE",
        );
      }
    } finally {
      storedStream.destroy();
    }
  } catch (error) {
    await storage.delete(storageKey);
    throw error;
  }

  return {
    checksum: hash.digest("hex"),
    extension,
    mimeType: upload.info.mimeType.toLowerCase(),
    originalName,
    sizeBytes,
    storageKey,
  };
}

export function validateUploadFilename(filename: string): string {
  const normalisedFilename = filename.trim();

  if (
    !normalisedFilename ||
    normalisedFilename.length > 255 ||
    normalisedFilename.includes("/") ||
    normalisedFilename.includes("\\") ||
    /[\0-\x1f]/.test(normalisedFilename)
  ) {
    throw new UploadValidationError("The filename is not valid", "INVALID_FILENAME");
  }

  return normalisedFilename;
}
