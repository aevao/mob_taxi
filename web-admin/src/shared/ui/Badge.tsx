import type { ReactNode } from "react";
import { cn } from "@/shared/lib";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-zinc-100 text-zinc-700",
  brand: "bg-brand-100 text-brand-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
};

const dots: Record<BadgeTone, string> = {
  neutral: "bg-zinc-400",
  brand: "bg-brand-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", dot = false, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      {dot ? <span className={cn("size-1.5 rounded-full", dots[tone])} /> : null}
      {children}
    </span>
  );
}
