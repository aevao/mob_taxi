import { useNavigate } from "react-router";
import { ChevronRight } from "lucide-react";
import {
  ApplicantAvatar,
  ApplicationStatusBadge,
  type DriverApplication,
} from "@/entities/application";
import { formatPhone, timeAgo, formatDateTime } from "@/shared/lib";
import { Skeleton } from "@/shared/ui";

interface ApplicationsTableProps {
  items: DriverApplication[];
  loading?: boolean;
}

export function ApplicationsTable({ items, loading }: ApplicationsTableProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-500">
            <th className="px-5 py-3 font-medium">Applicant</th>
            <th className="px-5 py-3 font-medium">Vehicle</th>
            <th className="px-5 py-3 font-medium">Phone</th>
            <th className="px-5 py-3 font-medium">Submitted</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="w-10 px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {items.map((app) => {
            const open = () => navigate(`/applications/${app.id}`);
            return (
              <tr
                key={app.id}
                onClick={open}
                onKeyDown={(event) => {
                  if (event.key === "Enter") open();
                }}
                tabIndex={0}
                className="group cursor-pointer transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <ApplicantAvatar application={app} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-900">
                        {app.firstName} {app.lastName}
                      </p>
                      <p className="truncate text-[13px] text-zinc-500">{app.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-zinc-900">
                    {app.vehicle.year} {app.vehicle.make} {app.vehicle.model}
                  </p>
                  <p className="text-[13px] text-zinc-500">
                    {app.vehicle.color} ·{" "}
                    <span className="font-mono text-zinc-600">{app.vehicle.plate}</span>
                  </p>
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap text-zinc-700 tabular-nums">
                  {formatPhone(app.phone)}
                </td>
                <td
                  className="px-5 py-3.5 whitespace-nowrap text-zinc-700"
                  title={formatDateTime(app.submittedAt)}
                >
                  {timeAgo(app.submittedAt)}
                </td>
                <td className="px-5 py-3.5">
                  <ApplicationStatusBadge status={app.status} />
                </td>
                <td className="px-5 py-3.5 text-zinc-300 group-hover:text-zinc-500">
                  <ChevronRight className="size-4" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
