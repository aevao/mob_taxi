import { useSearchParams } from "react-router";
import type { ApplicationStatus } from "@/entities/application";

export type StatusFilter = ApplicationStatus | "all";

const STATUSES: StatusFilter[] = ["all", "pending_review", "approved", "rejected"];

/** Filters live in the URL so a filtered list can be bookmarked or shared. */
export function useApplicationFilters() {
  const [params, setParams] = useSearchParams();

  const raw = params.get("status") ?? "pending_review";
  const status = (STATUSES.includes(raw as StatusFilter) ? raw : "pending_review") as StatusFilter;
  const q = params.get("q") ?? "";

  const update = (patch: { status?: StatusFilter; q?: string }) => {
    const next = new URLSearchParams(params);
    if (patch.status !== undefined) next.set("status", patch.status);
    if (patch.q !== undefined) {
      if (patch.q) next.set("q", patch.q);
      else next.delete("q");
    }
    setParams(next, { replace: true });
  };

  return {
    status,
    q,
    setStatus: (value: StatusFilter) => update({ status: value }),
    setQuery: (value: string) => update({ q: value }),
  };
}
