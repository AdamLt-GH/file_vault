import { apiRequest } from "../../api/http";

export interface StoredFile {
  checksum: string;
  createdAt: string;
  extension: string;
  folderId: string | null;
  id: string;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
  updatedAt: string;
}

interface FileListResponse {
  files: StoredFile[];
}

interface FileResponse {
  file: StoredFile;
}

export function listFiles(folderId?: string): Promise<FileListResponse> {
  const query = folderId ? `?folderId=${encodeURIComponent(folderId)}` : "";
  return apiRequest<FileListResponse>(`/files${query}`);
}

export function uploadFile(file: File): Promise<FileResponse> {
  const body = new FormData();
  body.append("file", file);

  return apiRequest<FileResponse>("/files/upload", {
    body,
    method: "POST",
  });
}

export function getDownloadUrl(fileId: string): string {
  return `/api/v1/files/${encodeURIComponent(fileId)}/download`;
}

export function updateFile(
  fileId: string,
  changes: { folderId?: string | null; name?: string },
): Promise<FileResponse> {
  return apiRequest<FileResponse>(`/files/${encodeURIComponent(fileId)}`, {
    body: JSON.stringify(changes),
    method: "PATCH",
  });
}

export function deleteFile(fileId: string): Promise<void> {
  return apiRequest<void>(`/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
  });
}
