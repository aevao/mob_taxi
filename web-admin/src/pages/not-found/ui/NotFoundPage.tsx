import { Link } from "react-router";
import { Compass } from "lucide-react";
import { EmptyState } from "@/shared/ui";

export function NotFoundPage() {
  return (
    <EmptyState
      icon={<Compass className="size-5" />}
      title="Page not found"
      description="The page you're looking for doesn't exist."
      action={
        <Link
          to="/"
          className="inline-flex h-10 items-center rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Back to dashboard
        </Link>
      }
    />
  );
}
