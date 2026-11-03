import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  applicationApi,
  applicationKeys,
  type DriverApplication,
} from "@/entities/application";
import { statsKeys } from "@/entities/stats";

type Decision = { kind: "approve"; note?: string } | { kind: "reject"; note: string };

export function useReviewApplication(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (decision: Decision) =>
      decision.kind === "approve"
        ? applicationApi.approve(id, decision.note)
        : applicationApi.reject(id, decision.note),
    onSuccess: (application: DriverApplication) => {
      queryClient.setQueryData(applicationKeys.detail(id), application);
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      void queryClient.invalidateQueries({ queryKey: statsKeys.all });
    },
  });
}
