import { cn } from "@/shared/lib";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-zinc-100", className)} />;
}
