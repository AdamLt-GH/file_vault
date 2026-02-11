import { apiRequest } from "../../api/http";

export interface StorageSummary {
  fileCount: number;
  folderCount: number;
  latestUploadAt: string | null;
  usedBytes: number;
}

interface StorageSummaryResponse {
  summary: StorageSummary;
}

export function getStorageSummary(): Promise<StorageSummaryResponse> {
  return apiRequest<StorageSummaryResponse>("/storage/summary");
}
