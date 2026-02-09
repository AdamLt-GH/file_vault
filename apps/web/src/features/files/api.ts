import { ApiError, apiRequest } from "../../api/http";

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

export interface FileListResponse {
  files: StoredFile[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface FileSearchResponse extends FileListResponse {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface FileResponse {
  file: StoredFile;
}

export type FileSort = "createdAt" | "name" | "size";
export type SortDirection = "asc" | "desc";

export interface FileListOptions {
  page: number;
  pageSize?: number;
  sortBy: FileSort;
  sortDirection: SortDirection;
}

export function listFiles(
  folderId: string | undefined,
  options: FileListOptions,
): Promise<FileListResponse> {
  const params = new URLSearchParams({
    page: options.page.toString(),
    pageSize: (options.pageSize ?? 20).toString(),
    sortBy: options.sortBy,
    sortDirection: options.sortDirection,
  });
  if (folderId) params.set("folderId", folderId);

  return apiRequest<FileListResponse>(`/files?${params.toString()}`);
}

export function searchFiles(
  query: string,
  page: number,
  pageSize = 20,
): Promise<FileSearchResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    q: query,
  });

  return apiRequest<FileSearchResponse>(`/search?${params.toString()}`);
}

export function uploadFile(file: File, folderId?: string): Promise<FileResponse> {
  const body = new FormData();
  body.append("file", file);
  const query = folderId ? `?folderId=${encodeURIComponent(folderId)}` : "";

  return apiRequest<FileResponse>(`/files/upload${query}`, {
    body,
    method: "POST",
  });
}

export function uploadFiles(
  files: File[],
  folderId?: string,
): Promise<FileResponse[]> {
  return Promise.all(files.map((file) => uploadFile(file, folderId)));
}

export function uploadFileWithProgress(
  file: File,
  folderId: string | undefined,
  onProgress: (percentage: number) => void,
): Promise<FileResponse> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append("file", file);
    const query = folderId ? `?folderId=${encodeURIComponent(folderId)}` : "";
    const request = new XMLHttpRequest();

    request.open("POST", `/api/v1/files/upload${query}`);
    request.withCredentials = true;
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      let response: FileResponse & {
        error?: { code?: string; message?: string };
      };

      try {
        response = JSON.parse(request.responseText) as typeof response;
      } catch {
        reject(new ApiError(request.status, "INVALID_RESPONSE", "Invalid server response"));
        return;
      }

      if (request.status >= 200 && request.status < 300) {
        resolve(response);
      } else {
        reject(
          new ApiError(
            request.status,
            response.error?.code ?? "UPLOAD_FAILED",
            response.error?.message ?? "The file could not be uploaded",
          ),
        );
      }
    });
    request.addEventListener("error", () => {
      reject(new ApiError(0, "NETWORK_ERROR", "File Vault could not be reached"));
    });
    request.send(body);
  });
}

export async function uploadFilesWithProgress(
  files: File[],
  folderId: string | undefined,
  onProgress: (percentage: number) => void,
): Promise<FileResponse[]> {
  const responses: FileResponse[] = [];

  for (const [index, file] of files.entries()) {
    const response = await uploadFileWithProgress(file, folderId, (percentage) => {
      const completed = index + percentage / 100;
      onProgress(Math.round((completed / files.length) * 100));
    });
    responses.push(response);
  }

  onProgress(100);
  return responses;
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
