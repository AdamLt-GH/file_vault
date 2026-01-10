import type { Request } from "express";
import busboy, { type Busboy, type FileInfo } from "busboy";
import type { Readable } from "node:stream";

export class UploadError extends Error {
  constructor(
    message: string,
    readonly code:
      | "FILE_REQUIRED"
      | "FILE_TOO_LARGE"
      | "INVALID_MULTIPART"
      | "TOO_MANY_FILES",
  ) {
    super(message);
    this.name = "UploadError";
  }
}

export interface IncomingUpload {
  info: FileInfo;
  stream: Readable;
}

export function parseSingleUpload<T>(
  request: Request,
  maxFileSizeBytes: number,
  handleFile: (upload: IncomingUpload) => Promise<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let fileTask: Promise<T> | undefined;
    let fileTaskError: unknown;
    let fileWasLimited = false;
    let tooManyFiles = false;
    let parser: Busboy;

    try {
      parser = busboy({
        headers: request.headers,
        limits: {
          fileSize: maxFileSizeBytes,
          files: 1,
        },
      });
    } catch {
      reject(
        new UploadError("The upload must use multipart form data", "INVALID_MULTIPART"),
      );
      return;
    }

    parser.on("file", (fieldName, stream, info) => {
      if (fieldName !== "file") {
        stream.resume();
        return;
      }

      stream.once("limit", () => {
        fileWasLimited = true;
      });

      fileTask = handleFile({ info, stream }).catch((error: unknown) => {
        fileTaskError = error;
        stream.resume();
        return undefined as T;
      });
    });

    parser.once("filesLimit", () => {
      tooManyFiles = true;
    });

    parser.once("error", () => {
      reject(new UploadError("The upload could not be read", "INVALID_MULTIPART"));
    });

    parser.once("finish", () => {
      void (async () => {
        if (tooManyFiles) {
          throw new UploadError("Upload one file at a time", "TOO_MANY_FILES");
        }

        if (!fileTask) {
          throw new UploadError("Choose a file to upload", "FILE_REQUIRED");
        }

        const result = await fileTask;

        if (fileTaskError) {
          throw fileTaskError;
        }

        if (fileWasLimited) {
          throw new UploadError("The file is larger than the upload limit", "FILE_TOO_LARGE");
        }

        resolve(result);
      })().catch(reject);
    });

    request.pipe(parser);
  });
}
