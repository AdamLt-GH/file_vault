import { prisma } from "../database/prisma.js";

interface SearchFilesInput {
  ownerId: string;
  page: number;
  pageSize: number;
  query: string;
}

export async function searchFiles(input: SearchFilesInput) {
  const where = {
    ownerId: input.ownerId,
    originalName: {
      contains: input.query,
      mode: "insensitive" as const,
    },
  };
  const skip = (input.page - 1) * input.pageSize;

  const [files, total] = await prisma.$transaction([
    prisma.storedFile.findMany({
      where,
      orderBy: [{ originalName: "asc" }, { id: "asc" }],
      skip,
      take: input.pageSize,
    }),
    prisma.storedFile.count({ where }),
  ]);

  return {
    files,
    page: input.page,
    pageSize: input.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
  };
}
