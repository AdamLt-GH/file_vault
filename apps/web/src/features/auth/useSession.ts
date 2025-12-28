import { useQuery } from "@tanstack/react-query";

import { getSession } from "./api";

export const sessionQueryKey = ["session"] as const;

export function useSession() {
  return useQuery({
    queryFn: getSession,
    queryKey: sessionQueryKey,
    retry: false,
    staleTime: 60_000,
  });
}
