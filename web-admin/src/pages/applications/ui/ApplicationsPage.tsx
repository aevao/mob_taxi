import { SearchX } from "lucide-react";
import { useApplications } from "@/entities/application";
import { ApplicationFiltersBar, useApplicationFilters } from "@/features/filter-applications";
import { ApplicationsTable } from "@/widgets/applications-table";
import { useDebouncedValue } from "@/shared/lib";
import { Button, Card, EmptyState, ErrorState, PageHeader } from "@/shared/ui";

export function ApplicationsPage() {
  const filters = useApplicationFilters();
  const q = useDebouncedValue(filters.q.trim());
  const query = useApplications({
    status: filters.status === "all" ? undefined : filters.status,
    q: q || undefined,
  });

  const items = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver applications"
        description="Verify documents and approve drivers before they can accept rides."
      />

      <ApplicationFiltersBar
        status={filters.status}
        query={filters.q}
        counts={query.data?.counts}
        onStatusChange={filters.setStatus}
        onQueryChange={filters.setQuery}
      />

      <Card className="overflow-hidden">
        {query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : !query.isLoading && items.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-5" />}
            title={filters.q ? "No matches" : "Nothing here yet"}
            description={
              filters.q
                ? `No applications match “${filters.q}”.`
                : "Applications submitted from the WHYP app will show up here."
            }
            action={
              filters.q ? (
                <Button variant="secondary" onClick={() => filters.setQuery("")}>
                  Clear search
                </Button>
              ) : null
            }
          />
        ) : (
          <ApplicationsTable items={items} loading={query.isLoading} />
        )}
      </Card>
    </div>
  );
}
