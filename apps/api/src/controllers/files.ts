import type { RequestHandler } from "express";
import { pipeline } from "node:stream/promises";
import { z } from "zod";

import type { Environment } from "../config/environment.js";
import { getMaxUploadSizeBytes } from "../config/upload-limits.js";
import { prisma } from "../database/prisma.js";
import { createDownloadHeaders } from "../downloads/headers.js";
import { findOwnedFolder } from "../services/folders.js";
import {
  deleteOwnedFile,
  FileOperationError,
  findOwnedFile,
  moveOwnedFile,
  renameOwnedFile,
} from "../services/files.js";
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
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "name", "size"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

const uploadFileQuery = z.object({
  folderId: z.uuid().optional(),
});

export const listFiles: RequestHandler = async (request, response) => {
  const query = listFilesQuery.safeParse(request.query);

  if (!query.success) {
    response.status(400).json({
      error: { code: "INVALID_QUERY", message: "File list options are not valid" },
    });
    return;
  }

  const sortFields = {
    createdAt: "createdAt",
    name: "originalName",
    size: "sizeBytes",
  } as const;

  const files = await prisma.storedFile.findMany({
    where: {
      folderId: query.data.folderId ?? null,
      ownerId: request.session.userId!,
    },
    orderBy: [
      {
        [sortFields[query.data.sortBy]]: query.data.sortDirection,
      },
      { id: "asc" },
    ],
    skip: (query.data.page - 1) * query.data.pageSize,
    take: query.data.pageSize,
  });

  response.status(200).json({
    files: files.map((file) => ({
      ...file,
      sizeBytes: Number(file.sizeBytes),
    })),
  });
};

export function createDownloadFileController(
  storage: StorageProvider,
): RequestHandler {
  return async (request, response) => {
    const fileId = z.uuid().safeParse(request.params.id);

    if (!fileId.success) {
      response.status(400).json({
        error: { code: "INVALID_FILE_ID", message: "File ID is not valid" },
      });
      return;
    }

    const file = await findOwnedFile(fileId.data, request.session.userId!);

    if (!file) {
      response.status(404).json({
        error: { code: "FILE_NOT_FOUND", message: "File not found" },
      });
      return;
    }

    const stream = await storage.open(file.storageKey);
    response.set(createDownloadHeaders(file));
    await pipeline(stream, response);
  };
}

export function createDeleteFileController(
  storage: StorageProvider,
): RequestHandler {
  return async (request, response) => {
    const fileId = z.uuid().safeParse(request.params.id);

    if (!fileId.success) {
      response.status(400).json({
        error: { code: "INVALID_FILE_ID", message: "File ID is not valid" },
      });
      return;
    }

    const deleted = await deleteOwnedFile(
      fileId.data,
      request.session.userId!,
      storage,
    );

    if (!deleted) {
      response.status(404).json({
        error: { code: "FILE_NOT_FOUND", message: "File not found" },
      });
      return;
    }

    response.status(204).send();
  };
}

const updateFileBody = z
  .object({
    folderId: z.uuid().nullable().optional(),
    name: z.string().optional(),
  })
  .refine((value) => value.folderId !== undefined || value.name !== undefined);

export const updateFile: RequestHandler = async (request, response) => {
  const fileId = z.uuid().safeParse(request.params.id);
  const body = updateFileBody.safeParse(request.body);

  if (!fileId.success || !body.success) {
    response.status(400).json({
      error: { code: "INVALID_REQUEST", message: "File changes are not valid" },
    });
    return;
  }

  try {
    let file = body.data.name
      ? await renameOwnedFile(
          fileId.data,
          request.session.userId!,
          body.data.name,
        )
      : await findOwnedFile(fileId.data, request.session.userId!);

    if (body.data.folderId !== undefined) {
      file = await moveOwnedFile(
        fileId.data,
        request.session.userId!,
        body.data.folderId,
      );
    }

    if (!file) {
      throw new FileOperationError("File not found", "FILE_NOT_FOUND");
    }

    response.status(200).json({
      file: { ...file, sizeBytes: Number(file.sizeBytes) },
    });
  } catch (error) {
    if (error instanceof FileOperationError) {
      const status =
        error.code === "FILE_NOT_FOUND" || error.code === "FOLDER_NOT_FOUND"
          ? 404
          : error.code === "DUPLICATE_FILE"
            ? 409
            : 400;
      response.status(status).json({
        error: { code: error.code, message: error.message },
      });
      return;
    }

    throw error;
  }
};

export function createUploadFileController({
  environment,
  storage,
}: FileControllerDependencies): RequestHandler {
  return async (request, response) => {
    let stagedUpload: StoredUpload | undefined;
    const query = uploadFileQuery.safeParse(request.query);

    if (!query.success) {
      response.status(400).json({
        error: { code: "INVALID_QUERY", message: "Folder ID is not valid" },
      });
      return;
    }

    if (query.data.folderId) {
      const folder = await findOwnedFolder(
        query.data.folderId,
        request.session.userId!,
      );
      if (!folder) {
        response.status(404).json({
          error: { code: "FOLDER_NOT_FOUND", message: "Folder not found" },
        });
        return;
      }
    }

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
          folderId: query.data.folderId ?? null,
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
