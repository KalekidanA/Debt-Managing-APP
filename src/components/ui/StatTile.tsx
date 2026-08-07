import type { ReactNode } from "react";

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "critical" | "warning";
}

const TONE_VALUE_CLASSES: Record<NonNullable<StatTileProps["tone"]>, string> = {
  default: "text-foreground",
  critical: "text-critical",
  warning: "text-warning",
};

export function StatTile({ label, value, hint, icon, tone = "default" }: StatTileProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${TONE_VALUE_CLASSES[tone]}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
