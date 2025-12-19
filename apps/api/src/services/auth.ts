import { prisma } from "../database/prisma.js";
import type { LoginInput } from "../validation/auth.js";
import { passwordMatches } from "./password.js";

export interface AuthenticatedAdministrator {
  id: string;
  email: string;
}

export async function authenticateAdministrator(
  input: LoginInput,
): Promise<AuthenticatedAdministrator | null> {
  const administrator = await prisma.adminUser.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
    },
  });

  if (!administrator) {
    return null;
  }

  const matches = await passwordMatches(
    administrator.passwordHash,
    input.password,
  );

  if (!matches) {
    return null;
  }

  return {
    id: administrator.id,
    email: administrator.email,
  };
}
