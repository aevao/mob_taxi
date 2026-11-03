import { useState } from "react";
import { Check, X } from "lucide-react";
import type { DriverApplication } from "@/entities/application";
import { ApiError } from "@/shared/api";
import { cn } from "@/shared/lib";
import { Button, Modal, Textarea } from "@/shared/ui";
import { useReviewApplication } from "../model/useReviewApplication";

const QUICK_REASONS = [
  "Driver's license photo is unreadable",
  "Vehicle registration doesn't match the plate",
  "Proof of insurance has expired",
  "Vehicle photos are missing or unclear",
  "Vehicle doesn't meet fleet requirements",
];

type Dialog = "approve" | "reject" | null;

export function ReviewActions({ application }: { application: DriverApplication }) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [note, setNote] = useState("");
  const review = useReviewApplication(application.id);

  if (application.status !== "pending_review") return null;

  const open = (next: Dialog) => {
    review.reset();
    setNote("");
    setDialog(next);
  };
  const close = () => {
    if (!review.isPending) setDialog(null);
  };

  const confirm = () => {
    const trimmed = note.trim();
    if (dialog === "reject" && !trimmed) return;
    review.mutate(
      dialog === "approve"
        ? { kind: "approve", note: trimmed || undefined }
        : { kind: "reject", note: trimmed },
      { onSuccess: () => setDialog(null) }
    );
  };

  const errorMessage =
    review.error instanceof ApiError ? review.error.message : review.error ? "Something went wrong." : undefined;
  const name = `${application.firstName} ${application.lastName}`;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="danger" icon={<X className="size-4" />} onClick={() => open("reject")}>
          Reject
        </Button>
        <Button icon={<Check className="size-4" />} onClick={() => open("approve")}>
          Approve
        </Button>
      </div>

      <Modal
        open={dialog === "approve"}
        onClose={close}
        title={`Approve ${name}?`}
        description="They'll get an email saying they're approved to drive with WHYP."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={review.isPending}>
              Cancel
            </Button>
            <Button onClick={confirm} loading={review.isPending}>
              Approve driver
            </Button>
          </>
        }
      >
        <Textarea
          label="Internal note (optional)"
          placeholder="e.g. Documents verified, background check clear"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
        />
        {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}
      </Modal>

      <Modal
        open={dialog === "reject"}
        onClose={close}
        title={`Reject ${name}?`}
        description="The applicant sees this reason in the app and by email."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={review.isPending}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white ring-0 hover:bg-red-700 active:bg-red-800"
              onClick={confirm}
              loading={review.isPending}
              disabled={!note.trim()}
            >
              Reject application
            </Button>
          </>
        }
      >
        <div className="mb-3 flex flex-wrap gap-1.5">
          {QUICK_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setNote(reason)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
                note === reason
                  ? "bg-brand-50 text-brand-700 ring-brand-200"
                  : "text-zinc-600 ring-zinc-200 hover:bg-zinc-50"
              )}
            >
              {reason}
            </button>
          ))}
        </div>
        <Textarea
          label="Reason"
          placeholder="Explain what needs to be fixed"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
          hint={`${note.length}/500`}
        />
        {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}
      </Modal>
    </>
  );
}
