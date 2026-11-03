import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { http } from "@/shared/api";
import type { Rider } from "../model/types";

export const userKeys = {
  list: (q: string) => ["users", "list", q] as const,
};

export const userApi = {
  list: (q: string) =>
    http<{ items: Rider[] }>("/admin/users", { query: { q } }).then((res) => res.items),
};

export function useRiders(q: string) {
  return useQuery({
    queryKey: userKeys.list(q),
    queryFn: () => userApi.list(q),
    placeholderData: keepPreviousData,
  });
}
