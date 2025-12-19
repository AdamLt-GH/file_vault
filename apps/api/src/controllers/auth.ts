import type { RequestHandler } from "express";

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

