import type { Rider } from "@/entities/user";
import { formatDate, formatPhone, initials } from "@/shared/lib";
import { Avatar, Badge, Skeleton } from "@/shared/ui";

export function RidersTable({ items, loading }: { items: Rider[]; loading?: boolean }) {
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
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-xs text-zinc-500">
            <th className="px-5 py-3 font-medium">Rider</th>
            <th className="px-5 py-3 font-medium">Phone</th>
            <th className="px-5 py-3 font-medium">Billing city</th>
            <th className="px-5 py-3 font-medium">Joined</th>
            <th className="px-5 py-3 font-medium">Email</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {items.map((rider) => (
            <tr key={rider.id} className="hover:bg-zinc-50">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar fallback={initials(rider.firstName, rider.lastName)} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-900">
                      {rider.firstName} {rider.lastName}
                    </p>
                    <p className="truncate text-[13px] text-zinc-500">{rider.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5 whitespace-nowrap text-zinc-700 tabular-nums">
                {formatPhone(rider.phone)}
              </td>
              <td className="px-5 py-3.5 text-zinc-700">
                {rider.billingAddress.city}, {rider.billingAddress.state}
              </td>
              <td className="px-5 py-3.5 whitespace-nowrap text-zinc-700">
                {formatDate(rider.createdAt)}
              </td>
              <td className="px-5 py-3.5">
                {rider.emailVerified ? (
                  <Badge tone="success" dot>
                    Verified
                  </Badge>
                ) : (
                  <Badge tone="neutral" dot>
                    Unverified
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
