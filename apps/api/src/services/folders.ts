import { prisma } from "../database/prisma.js";

export class FolderError extends Error {
  constructor(
    message: string,
    readonly code:
      | "DUPLICATE_FOLDER"
      | "FOLDER_NOT_FOUND"
      | "INVALID_FOLDER_NAME",
  ) {
    super(message);
    this.name = "FolderError";
  }
}

export function validateFolderName(name: string): string {
  const normalisedName = name.trim();

  if (
    !normalisedName ||
    normalisedName.length > 255 ||
    normalisedName === "." ||
    normalisedName === ".." ||
    normalisedName.includes("/") ||
    normalisedName.includes("\\") ||
    /[\0-\x1f]/.test(normalisedName)
  ) {
    throw new FolderError("The folder name is not valid", "INVALID_FOLDER_NAME");
  }

  return normalisedName;
}

export async function findOwnedFolder(folderId: string, ownerId: string) {
  return prisma.folder.findFirst({
    where: {
      id: folderId,
      ownerId,
    },
  });
}

export async function listFolders(ownerId: string, parentFolderId: string | null) {
  return prisma.folder.findMany({
    where: {
      ownerId,
      parentFolderId,
    },
    orderBy: { name: "asc" },
  });
}
