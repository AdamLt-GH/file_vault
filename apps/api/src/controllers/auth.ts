import type { RequestHandler } from "express";

import { prisma } from "../database/prisma.js";
import { authenticateAdministrator } from "../services/auth.js";
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

  await new Promise<void>((resolve, reject) => {
    request.session.regenerate((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  request.session.userId = administrator.id;

  await new Promise<void>((resolve, reject) => {
    request.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

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
