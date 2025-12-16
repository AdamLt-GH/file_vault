import type { Environment } from "../config/environment.js";
import { prisma } from "../database/prisma.js";
import { hashPassword } from "./password.js";

export async function bootstrapAdministrator(
  environment: Environment,
): Promise<void> {
  const existingAdministrator = await prisma.adminUser.findFirst({
    select: { id: true },
  });

  if (existingAdministrator) {
    return;
  }

  const passwordHash = await hashPassword(
    environment.FILEVAULT_ADMIN_PASSWORD,
  );

  await prisma.adminUser.create({
    data: {
      email: environment.FILEVAULT_ADMIN_EMAIL.trim().toLowerCase(),
      passwordHash,
    },
  });

  console.log("Created the first File Vault administrator");
}

