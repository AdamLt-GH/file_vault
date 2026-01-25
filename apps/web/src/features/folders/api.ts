import { apiRequest } from "../../api/http";

export interface Folder {
  createdAt: string;
  id: string;
  name: string;
  parentFolderId: string | null;
  updatedAt: string;
}

interface FolderListResponse {
  folders: Folder[];
}

export function listFolders(parentFolderId?: string): Promise<FolderListResponse> {
  const query = parentFolderId
    ? `?parentFolderId=${encodeURIComponent(parentFolderId)}`
    : "";
  return apiRequest<FolderListResponse>(`/folders${query}`);
}

