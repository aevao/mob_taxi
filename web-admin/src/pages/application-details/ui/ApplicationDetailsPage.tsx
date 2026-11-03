import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import {
  ApplicantAvatar,
  ApplicationStatusBadge,
  ageFromDob,
  formatAddress,
  useApplication,
  type DriverApplication,
} from "@/entities/application";
import { ReviewActions } from "@/features/review-application";
import { DocumentGallery } from "@/widgets/document-gallery";
import { formatDateTime, formatPhone } from "@/shared/lib";
import { Card, CardHeader, ErrorState, Skeleton } from "@/shared/ui";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[13px] text-zinc-500">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-zinc-900">{children}</dd>
    </div>
  );
}

function DecisionBanner({ application }: { application: DriverApplication }) {
  if (application.status === "pending_review" || !application.reviewedAt) return null;
  const approved = application.status === "approved";

  return (
    <div
      className={
        approved
          ? "flex gap-3 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-100"
          : "flex gap-3 rounded-xl bg-red-50 p-4 ring-1 ring-red-100"
      }
    >
      {approved ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
      ) : (
        <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
      )}
      <div className="min-w-0 text-sm">
        <p className={approved ? "font-semibold text-emerald-900" : "font-semibold text-red-900"}>
          {approved ? "Approved" : "Rejected"} by {application.reviewedBy ?? "admin"} ·{" "}
          {formatDateTime(application.reviewedAt)}
        </p>
        {application.reviewNote ? (
          <p className={approved ? "mt-1 text-emerald-800" : "mt-1 text-red-800"}>
            {application.reviewNote}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ApplicationDetailsPage() {
  const { id = "" } = useParams();
  const query = useApplication(id);

  const back = (
    <Link
      to="/applications"
      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900"
    >
      <ArrowLeft className="size-4" /> Driver applications
    </Link>
  );

  if (query.isError) {
    return (
      <div className="space-y-6">
        {back}
        <Card>
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        </Card>
      </div>
    );
  }

  if (!query.data) {
    return (
      <div className="space-y-6">
        {back}
        <div className="flex items-center gap-4">
          <Skeleton className="size-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const app = query.data;

  return (
    <div className="space-y-6">
      {back}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <ApplicantAvatar application={app} size="xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="truncate text-2xl font-bold tracking-tight text-zinc-900">
                {app.firstName} {app.lastName}
              </h1>
              <ApplicationStatusBadge status={app.status} />
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Applied {formatDateTime(app.submittedAt)} ·{" "}
              <span className="font-mono text-xs">{app.id}</span>
            </p>
          </div>
        </div>
        <ReviewActions application={app} />
      </div>

      <DecisionBanner application={app} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Applicant" />
          <dl className="grid grid-cols-1 gap-x-6 gap-y-5 p-5 sm:grid-cols-2">
            <Field label="Email">
              <a href={`mailto:${app.email}`} className="text-brand-600 hover:underline">
                {app.email}
              </a>
            </Field>
            <Field label="Phone">
              <a href={`tel:${app.phone}`} className="tabular-nums hover:underline">
                {formatPhone(app.phone)}
              </a>
            </Field>
            <Field label="Date of birth">
              {app.dateOfBirth} · {ageFromDob(app.dateOfBirth)} y.o.
            </Field>
            <Field label="SSN">
              <span className="font-mono">•••-••-{app.ssnLast4}</span>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Home address">{formatAddress(app.address)}</Field>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Vehicle" />
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 p-5">
            <div className="col-span-2">
              <Field label="Make and model">
                {app.vehicle.year} {app.vehicle.make} {app.vehicle.model}
              </Field>
            </div>
            <Field label="Color">{app.vehicle.color}</Field>
            <Field label="Plate">
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px]">
                {app.vehicle.plate}
              </span>
            </Field>
          </dl>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Documents and photos"
          description="Click a photo to open it full size"
        />
        <div className="p-5">
          <DocumentGallery application={app} />
        </div>
      </Card>
    </div>
  );
}
