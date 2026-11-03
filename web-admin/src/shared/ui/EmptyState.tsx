import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        {icon}
      </span>
      <p className="text-[15px] font-semibold text-zinc-900">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
