import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createFolder,
  FolderError,
  validateFolderName,
} from "../src/services/folders.js";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("../src/database/prisma.js", () => ({
  prisma: {
    folder: {
      create: mocks.create,
      findFirst: mocks.findFirst,
      findMany: mocks.findMany,
    },
  },
}));

describe("folder services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(["", "..", "private/files", "private\\files", "bad\0name"])(
    "rejects the unsafe folder name %j",
    (name) => {
      expect(() => validateFolderName(name)).toThrow(FolderError);
    },
  );

  it("creates a root folder with a cleaned name", async () => {
    mocks.findFirst.mockResolvedValue(null);
    mocks.create.mockImplementation(({ data }) => ({
      ...data,
      id: "292804af-fe5f-44b8-bf20-a6358760fab2",
    }));

    const folder = await createFolder({
      name: "  Documents  ",
      ownerId: "1d72a054-5926-494d-84fc-927bd01546a0",
    });

    expect(folder.name).toBe("Documents");
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        name: "Documents",
        ownerId: "1d72a054-5926-494d-84fc-927bd01546a0",
        parentFolderId: null,
      },
    });
  });

  it("blocks duplicate names in the same folder", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "292804af-fe5f-44b8-bf20-a6358760fab2",
    });

    await expect(
      createFolder({
        name: "Documents",
        ownerId: "1d72a054-5926-494d-84fc-927bd01546a0",
      }),
    ).rejects.toMatchObject({ code: "DUPLICATE_FOLDER" });
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
