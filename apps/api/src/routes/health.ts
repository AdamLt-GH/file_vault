import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  response.status(200).json({
    service: "file-vault-api",
    status: "ok",
  });
});
