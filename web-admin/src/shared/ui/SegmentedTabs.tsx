import { cn } from "@/shared/lib";

export interface SegmentedTab<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedTabsProps<T extends string> {
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: SegmentedTabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-lg bg-zinc-100 p-1">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-md px-3 text-[13px] font-semibold transition-colors",
              active
                ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/70"
                : "text-zinc-500 hover:text-zinc-800"
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 text-[11px] leading-5 tabular-nums",
                  active ? "bg-brand-100 text-brand-700" : "bg-zinc-200/70 text-zinc-600"
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
