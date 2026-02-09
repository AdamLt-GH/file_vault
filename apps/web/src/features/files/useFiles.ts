import { useQuery } from "@tanstack/react-query";

import { listFiles, type FileListOptions } from "./api";

export function getFilesQueryKey(folderId?: string) {
  return ["files", folderId ?? "root"] as const;
}

export function useFiles(folderId: string | undefined, options: FileListOptions) {
  return useQuery({
    queryFn: () => listFiles(folderId, options),
    queryKey: [...getFilesQueryKey(folderId), options],
  });
}
