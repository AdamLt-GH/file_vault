import { useQuery } from "@tanstack/react-query";

import { getStorageSummary } from "./api";

export const storageSummaryQueryKey = ["storage-summary"] as const;

export function useStorageSummary() {
  return useQuery({
    queryFn: getStorageSummary,
    queryKey: storageSummaryQueryKey,
  });
}
