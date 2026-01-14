import { prisma } from "../database/prisma.js";
import type { StorageProvider } from "../storage/storage-provider.js";

export async function findOwnedFile(fileId: string, ownerId: string) {
  return prisma.storedFile.findFirst({
    where: {
      id: fileId,
      ownerId,
    },
  });
}

export async function deleteOwnedFile(
  fileId: string,
  ownerId: string,
  storage: StorageProvider,
): Promise<boolean> {
  const file = await findOwnedFile(fileId, ownerId);

  if (!file) return false;

  await prisma.$transaction(async (transaction) => {
    const deleted = await transaction.storedFile.deleteMany({
      where: {
        id: fileId,
        ownerId,
      },
    });

    if (deleted.count === 0) {
      throw new Error("The file changed before it could be deleted");
    }

    await storage.delete(file.storageKey);
  });

  return true;
}
