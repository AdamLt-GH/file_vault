import { prisma } from "../database/prisma.js";
import {
  getFileExtension,
  isAllowedMimeType,
  isSupportedExtension,
} from "../config/file-types.js";
import type { StorageProvider } from "../storage/storage-provider.js";
import { validateUploadFilename } from "../uploads/store-upload.js";

export class FileOperationError extends Error {
  constructor(
    message: string,
    readonly code:
      | "DUPLICATE_FILE"
      | "FILE_NOT_FOUND"
      | "INVALID_FILENAME"
      | "UNSUPPORTED_FILE_TYPE",
  ) {
    super(message);
    this.name = "FileOperationError";
  }
}

export async function findOwnedFile(fileId: string, ownerId: string) {
  return prisma.storedFile.findFirst({
    where: {
      id: fileId,
      ownerId,
    },
  });
}

export async function deleteOwnedFile(
  fileId: string,
  ownerId: string,
  storage: StorageProvider,
): Promise<boolean> {
  const file = await findOwnedFile(fileId, ownerId);

  if (!file) return false;

  await prisma.$transaction(async (transaction) => {
    const deleted = await transaction.storedFile.deleteMany({
      where: {
        id: fileId,
        ownerId,
      },
    });

    if (deleted.count === 0) {
      throw new Error("The file changed before it could be deleted");
    }

    await storage.delete(file.storageKey);
  });

  return true;
}

export async function renameOwnedFile(
  fileId: string,
  ownerId: string,
  requestedName: string,
) {
  const file = await findOwnedFile(fileId, ownerId);
  if (!file) {
    throw new FileOperationError("File not found", "FILE_NOT_FOUND");
  }

  let originalName: string;
  try {
    originalName = validateUploadFilename(requestedName);
  } catch {
    throw new FileOperationError("The filename is not valid", "INVALID_FILENAME");
  }

  const extension = getFileExtension(originalName);
  if (
    !extension ||
    !isSupportedExtension(extension) ||
    !isAllowedMimeType(extension, file.mimeType)
  ) {
    throw new FileOperationError(
      "The new extension does not match this file",
      "UNSUPPORTED_FILE_TYPE",
    );
  }

  const duplicate = await prisma.storedFile.findFirst({
    where: {
      folderId: file.folderId,
      id: { not: fileId },
      originalName,
      ownerId,
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new FileOperationError(
      "A file with this name already exists here",
      "DUPLICATE_FILE",
    );
  }

  return prisma.storedFile.update({
    where: { id: fileId },
    data: { extension, originalName },
  });
}
