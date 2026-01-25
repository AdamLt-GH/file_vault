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

export interface Breadcrumb {
  id: string;
  name: string;
}

interface BreadcrumbResponse {
  breadcrumbs: Breadcrumb[];
}

export function listFolders(parentFolderId?: string): Promise<FolderListResponse> {
  const query = parentFolderId
    ? `?parentFolderId=${encodeURIComponent(parentFolderId)}`
    : "";
  return apiRequest<FolderListResponse>(`/folders${query}`);
}

export function getBreadcrumbs(folderId: string): Promise<BreadcrumbResponse> {
  return apiRequest<BreadcrumbResponse>(
    `/folders/${encodeURIComponent(folderId)}/breadcrumbs`,
  );
}

export function createFolder(input: {
  name: string;
  parentFolderId?: string;
}): Promise<{ folder: Folder }> {
  return apiRequest<{ folder: Folder }>("/folders", {
    body: JSON.stringify(input),
    method: "POST",
  });
}
