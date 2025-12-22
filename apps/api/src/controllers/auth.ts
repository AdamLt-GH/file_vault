import type { RequestHandler } from "express";

import { prisma } from "../database/prisma.js";
import { authenticateAdministrator } from "../services/auth.js";
import {
  destroySession,
  regenerateSession,
  saveSession,
} from "../services/session.js";
import { loginSchema } from "../validation/auth.js";

export const login: RequestHandler = async (request, response) => {
  const parsedInput = loginSchema.safeParse(request.body);

  if (!parsedInput.success) {
    response.status(400).json({
      error: {
        code: "INVALID_REQUEST",
        message: "Enter a valid email and password",
      },
    });
    return;
  }

  const administrator = await authenticateAdministrator(parsedInput.data);

  if (!administrator) {
    response.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Email or password is incorrect",
      },
    });
    return;
  }

  await regenerateSession(request);

  request.session.userId = administrator.id;

  await saveSession(request);

  response.status(200).json({
    user: administrator,
  });
};

export const getSession: RequestHandler = async (request, response) => {
  if (!request.session.userId) {
    response.status(200).json({ user: null });
    return;
  }

  const administrator = await prisma.adminUser.findUnique({
    where: { id: request.session.userId },
    select: {
      id: true,
      email: true,
    },
  });

  if (!administrator) {
    delete request.session.userId;
    response.status(200).json({ user: null });
    return;
  }

  response.status(200).json({ user: administrator });
};

export const logout: RequestHandler = async (request, response) => {
  await destroySession(request);
  response.clearCookie("filevault.sid", { path: "/" });
  response.status(204).send();
};
