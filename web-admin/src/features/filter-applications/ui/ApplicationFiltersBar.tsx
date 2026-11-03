import { Search } from "lucide-react";
import type { ApplicationCounts } from "@/entities/application";
import { Input, SegmentedTabs } from "@/shared/ui";
import type { StatusFilter } from "../model/useApplicationFilters";

interface ApplicationFiltersBarProps {
  status: StatusFilter;
  query: string;
  counts?: ApplicationCounts;
  onStatusChange: (status: StatusFilter) => void;
  onQueryChange: (query: string) => void;
}

export function ApplicationFiltersBar({
  status,
  query,
  counts,
  onStatusChange,
  onQueryChange,
}: ApplicationFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <SegmentedTabs<StatusFilter>
        label="Filter by status"
        value={status}
        onChange={onStatusChange}
        tabs={[
          { value: "pending_review", label: "In review", count: counts?.pending },
          { value: "approved", label: "Approved", count: counts?.approved },
          { value: "rejected", label: "Rejected", count: counts?.rejected },
          { value: "all", label: "All", count: counts?.total },
        ]}
      />
      <Input
        type="search"
        aria-label="Search applications"
        placeholder="Search name, email, phone or plate"
        icon={<Search className="size-4" />}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        className="w-full sm:w-80"
      />
    </div>
  );
}
