import type { RequestHandler } from "express";

import { getStorageSummary } from "../services/storage-summary.js";

export const storageSummary: RequestHandler = async (request, response) => {
  const summary = await getStorageSummary(request.session.userId!);
  response.status(200).json({ summary });
};
