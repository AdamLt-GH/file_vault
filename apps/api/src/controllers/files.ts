import type { RequestHandler } from "express";
import { z } from "zod";

import type { Environment } from "../config/environment.js";
import { getMaxUploadSizeBytes } from "../config/upload-limits.js";
import { prisma } from "../database/prisma.js";
import type { StorageProvider } from "../storage/storage-provider.js";
import { parseSingleUpload, UploadError } from "../uploads/multipart.js";
import {
  storeUpload,
  type StoredUpload,
  UploadValidationError,
} from "../uploads/store-upload.js";

interface FileControllerDependencies {
  environment: Environment;
  storage: StorageProvider;
}

const listFilesQuery = z.object({
  folderId: z.uuid().optional(),
});

export const listFiles: RequestHandler = async (request, response) => {
  const query = listFilesQuery.safeParse(request.query);

  if (!query.success) {
    response.status(400).json({
      error: { code: "INVALID_QUERY", message: "Folder ID is not valid" },
    });
    return;
  }

  const files = await prisma.storedFile.findMany({
    where: {
      folderId: query.data.folderId ?? null,
      ownerId: request.session.userId!,
    },
    orderBy: { createdAt: "desc" },
  });

  response.status(200).json({
    files: files.map((file) => ({
      ...file,
      sizeBytes: Number(file.sizeBytes),
    })),
  });
};

export function createUploadFileController({
  environment,
  storage,
}: FileControllerDependencies): RequestHandler {
  return async (request, response) => {
    let stagedUpload: StoredUpload | undefined;

    try {
      stagedUpload = await parseSingleUpload(
        request,
        getMaxUploadSizeBytes(environment),
        async (upload) => {
          stagedUpload = await storeUpload(upload, storage);
          return stagedUpload;
        },
      );

      const file = await prisma.storedFile.create({
        data: {
          checksum: stagedUpload.checksum,
          extension: stagedUpload.extension,
          mimeType: stagedUpload.mimeType,
          originalName: stagedUpload.originalName,
          ownerId: request.session.userId!,
          sizeBytes: BigInt(stagedUpload.sizeBytes),
          storageKey: stagedUpload.storageKey,
        },
      });

      response.status(201).json({
        file: {
          ...file,
          sizeBytes: Number(file.sizeBytes),
        },
      });
    } catch (error) {
      if (stagedUpload && (await storage.exists(stagedUpload.storageKey))) {
        await storage.delete(stagedUpload.storageKey);
      }

      if (error instanceof UploadError) {
        response.status(error.code === "FILE_TOO_LARGE" ? 413 : 400).json({
          error: { code: error.code, message: error.message },
        });
        return;
      }

      if (error instanceof UploadValidationError) {
        response.status(error.code === "UNSUPPORTED_FILE_TYPE" ? 415 : 400).json({
          error: { code: error.code, message: error.message },
        });
        return;
      }

      throw error;
    }
  };
}
