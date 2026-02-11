import { prisma } from "../database/prisma.js";

export async function getStorageSummary(ownerId: string) {
  const [fileTotals, folderCount] = await prisma.$transaction([
    prisma.storedFile.aggregate({
      where: { ownerId },
      _count: { _all: true },
      _max: { createdAt: true },
      _sum: { sizeBytes: true },
    }),
    prisma.folder.count({ where: { ownerId } }),
  ]);

  return {
    fileCount: fileTotals._count._all,
    folderCount,
    latestUploadAt: fileTotals._max.createdAt,
    usedBytes: Number(fileTotals._sum.sizeBytes ?? 0n),
  };
}
