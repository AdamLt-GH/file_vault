import { useQuery } from "@tanstack/react-query";

import { listFiles } from "./api";

export function getFilesQueryKey(folderId?: string) {
  return ["files", folderId ?? "root"] as const;
}

export function useFiles(folderId?: string) {
  return useQuery({
    queryFn: () => listFiles(folderId),
    queryKey: getFilesQueryKey(folderId),
  });
}
