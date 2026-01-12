import { prisma } from "../database/prisma.js";

export async function findOwnedFile(fileId: string, ownerId: string) {
  return prisma.storedFile.findFirst({
    where: {
      id: fileId,
      ownerId,
    },
  });
}
