import { useQueryClient } from "@tanstack/react-query";
import { sessionApi } from "@/entities/session";
import { tokenStorage } from "@/shared/api";

export function useLogout() {
  const queryClient = useQueryClient();

  return async () => {
    await sessionApi.logout().catch(() => undefined);
    tokenStorage.clear();
    queryClient.clear();
  };
}
