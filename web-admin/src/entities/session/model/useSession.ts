import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { tokenStorage } from "@/shared/api";
import { sessionApi } from "../api/sessionApi";

export const sessionKeys = {
  me: ["session", "me"] as const,
};

export function useAuthToken() {
  return useSyncExternalStore(tokenStorage.subscribe, tokenStorage.get);
}

export function useAdminProfile() {
  const token = useAuthToken();
  return useQuery({
    queryKey: sessionKeys.me,
    queryFn: sessionApi.me,
    enabled: token !== null,
    staleTime: 5 * 60 * 1000,
  });
}
