import { useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/lib";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, className, id, ...rest }: TextareaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={fieldId} className="text-[13px] font-medium text-zinc-700">
          {label}
        </label>
      ) : null}
      <textarea
        id={fieldId}
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-24 w-full resize-y rounded-lg bg-white px-3 py-2.5 text-sm text-zinc-900 ring-1 ring-inset ring-zinc-200 placeholder:text-zinc-400",
          "focus:outline-none focus:ring-2 focus:ring-brand-500",
          error && "ring-red-300 focus:ring-red-500"
        )}
        {...rest}
      />
      {error ? (
        <p className="text-[13px] text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-[13px] text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}
