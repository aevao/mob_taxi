import { Badge } from "@/shared/ui";
import { STATUS_META } from "../model/labels";
import type { ApplicationStatus } from "../model/types";

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
