import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl bg-white ring-1 ring-zinc-200/80", className)}
      {...rest}
    />
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 px-5 py-4">
      <div className="min-w-0">
        <h2 className="truncate text-[15px] font-semibold text-zinc-900">{title}</h2>
        {description ? (
          <p className="mt-0.5 truncate text-[13px] text-zinc-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
