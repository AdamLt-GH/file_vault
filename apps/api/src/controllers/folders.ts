import type { RequestHandler } from "express";
import { z } from "zod";

import {
  createFolder,
  deleteFolder,
  FolderError,
  getFolderBreadcrumbs,
  listFolders,
  renameFolder,
} from "../services/folders.js";

const listFoldersQuery = z.object({
  parentFolderId: z.uuid().optional(),
});

const createFolderBody = z.object({
  name: z.string(),
  parentFolderId: z.uuid().optional(),
});

export const getFolders: RequestHandler = async (request, response) => {
  const query = listFoldersQuery.safeParse(request.query);

  if (!query.success) {
    response.status(400).json({
      error: { code: "INVALID_QUERY", message: "Parent folder ID is not valid" },
    });
    return;
  }

  const folders = await listFolders(
    request.session.userId!,
    query.data.parentFolderId ?? null,
  );

  response.status(200).json({ folders });
};

export const postFolder: RequestHandler = async (request, response) => {
  const body = createFolderBody.safeParse(request.body);

  if (!body.success) {
    response.status(400).json({
      error: { code: "INVALID_REQUEST", message: "Folder details are not valid" },
    });
    return;
  }

  try {
    const folder = await createFolder({
      name: body.data.name,
      ownerId: request.session.userId!,
      ...(body.data.parentFolderId
        ? { parentFolderId: body.data.parentFolderId }
        : {}),
    });

    response.status(201).json({ folder });
  } catch (error) {
    if (error instanceof FolderError) {
      const status =
        error.code === "DUPLICATE_FOLDER"
          ? 409
          : error.code === "FOLDER_NOT_FOUND"
            ? 404
            : 400;
      response.status(status).json({
        error: { code: error.code, message: error.message },
      });
      return;
    }

    throw error;
  }
};

export const getBreadcrumbs: RequestHandler = async (request, response) => {
  const folderId = z.uuid().safeParse(request.params.id);

  if (!folderId.success) {
    response.status(400).json({
      error: { code: "INVALID_FOLDER_ID", message: "Folder ID is not valid" },
    });
    return;
  }

  try {
    const breadcrumbs = await getFolderBreadcrumbs(
      folderId.data,
      request.session.userId!,
    );
    response.status(200).json({ breadcrumbs });
  } catch (error) {
    if (error instanceof FolderError) {
      response.status(404).json({
        error: { code: error.code, message: error.message },
      });
      return;
    }

    throw error;
  }
};

const renameFolderBody = z.object({ name: z.string() });

export const patchFolder: RequestHandler = async (request, response) => {
  const folderId = z.uuid().safeParse(request.params.id);
  const body = renameFolderBody.safeParse(request.body);

  if (!folderId.success || !body.success) {
    response.status(400).json({
      error: { code: "INVALID_REQUEST", message: "Folder details are not valid" },
    });
    return;
  }

  try {
    const folder = await renameFolder(
      folderId.data,
      request.session.userId!,
      body.data.name,
    );
    response.status(200).json({ folder });
  } catch (error) {
    if (error instanceof FolderError) {
      response.status(error.code === "FOLDER_NOT_FOUND" ? 404 : 409).json({
        error: { code: error.code, message: error.message },
      });
      return;
    }
    throw error;
  }
};

export const removeFolder: RequestHandler = async (request, response) => {
  const folderId = z.uuid().safeParse(request.params.id);

  if (!folderId.success) {
    response.status(400).json({
      error: { code: "INVALID_FOLDER_ID", message: "Folder ID is not valid" },
    });
    return;
  }

  try {
    await deleteFolder(folderId.data, request.session.userId!);
    response.status(204).send();
  } catch (error) {
    if (error instanceof FolderError) {
      response.status(error.code === "FOLDER_NOT_FOUND" ? 404 : 409).json({
        error: { code: error.code, message: error.message },
      });
      return;
    }
    throw error;
  }
};
