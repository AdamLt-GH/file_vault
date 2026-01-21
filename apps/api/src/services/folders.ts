import { Prisma } from "@prisma/client";

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

interface CreateFolderInput {
  name: string;
  ownerId: string;
  parentFolderId?: string;
}

export async function createFolder(input: CreateFolderInput) {
  const name = validateFolderName(input.name);
  const parentFolderId = input.parentFolderId ?? null;

  if (parentFolderId) {
    const parent = await findOwnedFolder(parentFolderId, input.ownerId);
    if (!parent) {
      throw new FolderError("Parent folder not found", "FOLDER_NOT_FOUND");
    }
  }

  const existingFolder = await prisma.folder.findFirst({
    where: {
      name,
      ownerId: input.ownerId,
      parentFolderId,
    },
    select: { id: true },
  });

  if (existingFolder) {
    throw new FolderError(
      "A folder with this name already exists here",
      "DUPLICATE_FOLDER",
    );
  }

  try {
    return await prisma.folder.create({
      data: {
        name,
        ownerId: input.ownerId,
        parentFolderId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new FolderError(
        "A folder with this name already exists here",
        "DUPLICATE_FOLDER",
      );
    }

    throw error;
  }
}
