import type { RequestHandler } from "express";
import { z } from "zod";

import { searchFiles } from "../services/search.js";

const searchQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(255),
});

export const search: RequestHandler = async (request, response) => {
  const query = searchQuery.safeParse(request.query);

  if (!query.success) {
    response.status(400).json({
      error: { code: "INVALID_SEARCH", message: "Search details are not valid" },
    });
    return;
  }

  const results = await searchFiles({
    ownerId: request.session.userId!,
    page: query.data.page,
    pageSize: query.data.pageSize,
    query: query.data.q,
  });

  response.status(200).json({
    ...results,
    files: results.files.map((file) => ({
      ...file,
      sizeBytes: Number(file.sizeBytes),
    })),
  });
};

