import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <EmptyState
      icon={<AlertTriangle className="size-5" />}
      title="Couldn't load data"
      description={error instanceof Error ? error.message : "Something went wrong."}
      action={
        onRetry ? (
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        ) : null
      }
    />
  );
}
