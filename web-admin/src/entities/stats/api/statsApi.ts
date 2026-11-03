import { useQuery } from "@tanstack/react-query";
import { http } from "@/shared/api";
import type { ApplicationCounts, DriverApplication } from "@/entities/application/@x/stats";

export interface AdminStats {
  riders: number;
  verifiedRiders: number;
  newRiders7d: number;
  applications: ApplicationCounts;
  recentPending: DriverApplication[];
}

export const statsKeys = {
  all: ["stats"] as const,
};

export function useAdminStats() {
  return useQuery({
    queryKey: statsKeys.all,
    queryFn: () => http<AdminStats>("/admin/stats"),
    refetchInterval: 30_000,
  });
}
