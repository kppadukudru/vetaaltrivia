import { queryOptions } from "@tanstack/react-query";

import { ensureAnonymousSession } from "@/lib/anonymous-session";
import { getCategoryCatalog } from "@/lib/quiz.functions";

export const catalogQueryKey = ["category-catalog"] as const;

export const catalogQueryOptions = queryOptions({
  queryKey: catalogQueryKey,
  queryFn: async () => {
    await ensureAnonymousSession();
    return getCategoryCatalog();
  },
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
});
