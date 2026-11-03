import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/lib";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
}

export function Input({ label, icon, error, className, id, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={inputId} className="text-[13px] font-medium text-zinc-700">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
            {icon}
          </span>
        ) : null}
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-10 w-full rounded-lg bg-white text-sm text-zinc-900 ring-1 ring-inset ring-zinc-200 placeholder:text-zinc-400",
            "transition-shadow focus:outline-none focus:ring-2 focus:ring-brand-500",
            icon ? "pl-9 pr-3" : "px-3",
            error && "ring-red-300 focus:ring-red-500"
          )}
          {...rest}
        />
      </div>
      {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
    </div>
  );
}
