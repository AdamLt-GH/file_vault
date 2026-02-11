import { beforeEach, describe, expect, it, vi } from "vitest";

import { getStorageSummary } from "../src/services/storage-summary.js";

const mocks = vi.hoisted(() => ({
  aggregateFiles: vi.fn(),
  countFolders: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("../src/database/prisma.js", () => ({
  prisma: {
    folder: { count: mocks.countFolders },
    storedFile: { aggregate: mocks.aggregateFiles },
    $transaction: mocks.transaction,
  },
}));

describe("storage summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation((work) => Promise.all(work));
  });

  it("returns JSON-safe totals for one owner", async () => {
    const latestUpload = new Date("2026-02-11T01:00:00.000Z");
    mocks.aggregateFiles.mockResolvedValue({
      _count: { _all: 8 },
      _max: { createdAt: latestUpload },
      _sum: { sizeBytes: 4096n },
    });
    mocks.countFolders.mockResolvedValue(3);

    await expect(getStorageSummary("owner-1")).resolves.toEqual({
      fileCount: 8,
      folderCount: 3,
      latestUploadAt: latestUpload,
      usedBytes: 4096,
    });
    expect(mocks.aggregateFiles).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: "owner-1" } }),
    );
    expect(mocks.countFolders).toHaveBeenCalledWith({
      where: { ownerId: "owner-1" },
    });
  });
});
