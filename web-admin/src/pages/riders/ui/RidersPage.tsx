import { useState } from "react";
import { Search, Users } from "lucide-react";
import { useRiders } from "@/entities/user";
import { RidersTable } from "@/widgets/riders-table";
import { useDebouncedValue } from "@/shared/lib";
import { Card, EmptyState, ErrorState, Input, PageHeader } from "@/shared/ui";

export function RidersPage() {
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim());
  const riders = useRiders(q);
  const items = riders.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riders"
        description="Everyone who has created a WHYP passenger account."
        actions={
          <Input
            type="search"
            aria-label="Search riders"
            placeholder="Search name, email or phone"
            icon={<Search className="size-4" />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full sm:w-80"
          />
        }
      />

      <Card className="overflow-hidden">
        {riders.isError ? (
          <ErrorState error={riders.error} onRetry={() => riders.refetch()} />
        ) : !riders.isLoading && items.length === 0 ? (
          <EmptyState
            icon={<Users className="size-5" />}
            title={q ? "No matches" : "No riders yet"}
            description={q ? `No riders match “${q}”.` : "Accounts created in the app appear here."}
          />
        ) : (
          <RidersTable items={items} loading={riders.isLoading} />
        )}
      </Card>
    </div>
  );
}
