import { useQuery } from "@tanstack/react-query";

import { listFolders } from "./api";

export function getFoldersQueryKey(parentFolderId?: string) {
  return ["folders", parentFolderId ?? "root"] as const;
}

export function useFolders(parentFolderId?: string) {
  return useQuery({
    queryFn: () => listFolders(parentFolderId),
    queryKey: getFoldersQueryKey(parentFolderId),
  });
}
