import { useQuery } from "@tanstack/react-query";

import { searchFiles } from "../files/api";

export function useSearchFiles(query: string, page: number) {
  return useQuery({
    enabled: query.length > 0,
    queryFn: () => searchFiles(query, page),
    queryKey: ["file-search", query, page],
  });
}
