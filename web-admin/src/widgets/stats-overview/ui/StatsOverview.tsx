import type { ReactNode } from "react";
import { Link } from "react-router";
import { CheckCircle2, Clock3, UserCheck, Users } from "lucide-react";
import type { AdminStats } from "@/entities/stats";
import { cn } from "@/shared/lib";
import { Card, Skeleton } from "@/shared/ui";

interface StatCardProps {
  label: string;
  value?: number;
  hint?: string;
  icon: ReactNode;
  accent: string;
  to?: string;
}

function StatCard({ label, value, hint, icon, accent, to }: StatCardProps) {
  const body = (
    <Card
      className={cn(
        "flex h-full items-start justify-between gap-4 p-5",
        to && "transition-shadow hover:shadow-md hover:ring-zinc-300"
      )}
    >
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-zinc-500">{label}</p>
        {value === undefined ? (
          <Skeleton className="mt-2 h-8 w-16" />
        ) : (
          <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 tabular-nums">
            {value}
          </p>
        )}
        {hint ? <p className="mt-1 text-[13px] text-zinc-500">{hint}</p> : null}
      </div>
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", accent)}>
        {icon}
      </span>
    </Card>
  );

  return to ? (
    <Link to={to} className="block rounded-xl focus-visible:outline-2 focus-visible:outline-brand-500">
      {body}
    </Link>
  ) : (
    body
  );
}

export function StatsOverview({ stats }: { stats?: AdminStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Awaiting review"
        value={stats?.applications.pending}
        hint="Driver applications"
        icon={<Clock3 className="size-5" />}
        accent="bg-amber-50 text-amber-600"
        to="/applications?status=pending_review"
      />
      <StatCard
        label="Approved drivers"
        value={stats?.applications.approved}
        hint={stats ? `${stats.applications.rejected} rejected` : undefined}
        icon={<CheckCircle2 className="size-5" />}
        accent="bg-emerald-50 text-emerald-600"
        to="/applications?status=approved"
      />
      <StatCard
        label="Riders"
        value={stats?.riders}
        hint={stats ? `+${stats.newRiders7d} this week` : undefined}
        icon={<Users className="size-5" />}
        accent="bg-brand-50 text-brand-600"
        to="/riders"
      />
      <StatCard
        label="Verified emails"
        value={stats?.verifiedRiders}
        hint={
          stats && stats.riders > 0
            ? `${Math.round((stats.verifiedRiders / stats.riders) * 100)}% of riders`
            : undefined
        }
        icon={<UserCheck className="size-5" />}
        accent="bg-sky-50 text-sky-600"
      />
    </div>
  );
}
