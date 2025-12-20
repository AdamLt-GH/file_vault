import type { RequestHandler } from "express";

export const requireAuthentication: RequestHandler = (
  request,
  response,
  next,
) => {
  if (!request.session.userId) {
    response.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Log in to continue",
      },
    });
    return;
  }

  next();
};

