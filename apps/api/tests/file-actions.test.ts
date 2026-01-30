import { beforeEach, describe, expect, it, vi } from "vitest";

import { moveOwnedFile, renameOwnedFile } from "../src/services/files.js";

const mocks = vi.hoisted(() => ({
  findFile: vi.fn(),
  findFolder: vi.fn(),
  updateFile: vi.fn(),
}));

vi.mock("../src/database/prisma.js", () => ({
  prisma: {
    folder: { findFirst: mocks.findFolder },
    storedFile: {
      findFirst: mocks.findFile,
      update: mocks.updateFile,
    },
  },
}));

const ownerId = "1d72a054-5926-494d-84fc-927bd01546a0";
const fileId = "37bff070-71d7-4dc4-b074-bb14f7dcb1e7";
const folderId = "292804af-fe5f-44b8-bf20-a6358760fab2";

describe("file rename and move services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renames an owned file without changing its matching extension", async () => {
    mocks.findFile
      .mockResolvedValueOnce({
        folderId: null,
        mimeType: "text/plain",
        originalName: "notes.txt",
      })
      .mockResolvedValueOnce(null);
    mocks.updateFile.mockResolvedValue({
      id: fileId,
      originalName: "private notes.txt",
    });

    await renameOwnedFile(fileId, ownerId, "private notes.txt");

    expect(mocks.updateFile).toHaveBeenCalledWith({
      where: { id: fileId },
      data: { extension: "txt", originalName: "private notes.txt" },
    });
  });

  it("moves a file into an owned folder", async () => {
    mocks.findFile
      .mockResolvedValueOnce({
        folderId: null,
        originalName: "notes.txt",
      })
      .mockResolvedValueOnce(null);
    mocks.findFolder.mockResolvedValue({ id: folderId, ownerId });
    mocks.updateFile.mockResolvedValue({ id: fileId, folderId });

    await moveOwnedFile(fileId, ownerId, folderId);

    expect(mocks.updateFile).toHaveBeenCalledWith({
      where: { id: fileId },
      data: { folderId },
    });
  });

  it("does not move a file into an unknown folder", async () => {
    mocks.findFile.mockResolvedValue({
      folderId: null,
      originalName: "notes.txt",
    });
    mocks.findFolder.mockResolvedValue(null);

    await expect(moveOwnedFile(fileId, ownerId, folderId)).rejects.toMatchObject({
      code: "FOLDER_NOT_FOUND",
    });
    expect(mocks.updateFile).not.toHaveBeenCalled();
  });
});
