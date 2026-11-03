import { Link } from "react-router";
import { ArrowRight, Inbox } from "lucide-react";
import { useAdminProfile } from "@/entities/session";
import { useAdminStats } from "@/entities/stats";
import { ApplicationsTable } from "@/widgets/applications-table";
import { StatsOverview } from "@/widgets/stats-overview";
import { Card, CardHeader, EmptyState, ErrorState, PageHeader } from "@/shared/ui";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const stats = useAdminStats();
  const profile = useAdminProfile();
  const name = profile.data?.email.split("@")[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title={name ? `${greeting()}, ${name}` : greeting()}
        description="Here's what needs your attention today."
      />

      {stats.isError ? (
        <Card>
          <ErrorState error={stats.error} onRetry={() => stats.refetch()} />
        </Card>
      ) : (
        <StatsOverview stats={stats.data} />
      )}

      <Card>
        <CardHeader
          title="Waiting for review"
          description="Newest driver applications first"
          action={
            <Link
              to="/applications?status=pending_review"
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          }
        />
        {stats.data && stats.data.recentPending.length === 0 ? (
          <EmptyState
            icon={<Inbox className="size-5" />}
            title="Inbox zero"
            description="Every driver application has been reviewed."
          />
        ) : (
          <ApplicationsTable items={stats.data?.recentPending ?? []} loading={stats.isLoading} />
        )}
      </Card>
    </div>
  );
}
