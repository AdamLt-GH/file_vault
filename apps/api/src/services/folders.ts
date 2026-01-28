import { Prisma } from "@prisma/client";

import { prisma } from "../database/prisma.js";

export class FolderError extends Error {
  constructor(
    message: string,
    readonly code:
      | "DUPLICATE_FOLDER"
      | "FOLDER_NOT_EMPTY"
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

export async function getFolderBreadcrumbs(folderId: string, ownerId: string) {
  const breadcrumbs: Array<{ id: string; name: string }> = [];
  const visited = new Set<string>();
  let currentFolderId: string | null = folderId;

  while (currentFolderId) {
    if (visited.has(currentFolderId) || visited.size >= 100) {
      throw new Error("The folder tree contains a cycle");
    }

    visited.add(currentFolderId);
    const folder = await findOwnedFolder(currentFolderId, ownerId);

    if (!folder) {
      throw new FolderError("Folder not found", "FOLDER_NOT_FOUND");
    }

    breadcrumbs.unshift({ id: folder.id, name: folder.name });
    currentFolderId = folder.parentFolderId;
  }

  return breadcrumbs;
}

export async function renameFolder(
  folderId: string,
  ownerId: string,
  requestedName: string,
) {
  const folder = await findOwnedFolder(folderId, ownerId);
  if (!folder) {
    throw new FolderError("Folder not found", "FOLDER_NOT_FOUND");
  }

  const name = validateFolderName(requestedName);
  const duplicate = await prisma.folder.findFirst({
    where: {
      id: { not: folderId },
      name,
      ownerId,
      parentFolderId: folder.parentFolderId,
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new FolderError(
      "A folder with this name already exists here",
      "DUPLICATE_FOLDER",
    );
  }

  return prisma.folder.update({
    where: { id: folderId },
    data: { name },
  });
}
