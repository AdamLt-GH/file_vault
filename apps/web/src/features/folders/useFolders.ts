import { useQuery } from "@tanstack/react-query";

import { getBreadcrumbs, listFolders } from "./api";

export function getFoldersQueryKey(parentFolderId?: string) {
  return ["folders", parentFolderId ?? "root"] as const;
}

export function useFolders(parentFolderId?: string) {
  return useQuery({
    queryFn: () => listFolders(parentFolderId),
    queryKey: getFoldersQueryKey(parentFolderId),
  });
}

export function useBreadcrumbs(folderId?: string) {
  return useQuery({
    enabled: Boolean(folderId),
    queryFn: () => getBreadcrumbs(folderId!),
    queryKey: ["breadcrumbs", folderId],
  });
}
