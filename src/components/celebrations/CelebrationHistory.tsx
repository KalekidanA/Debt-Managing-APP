import { format } from "date-fns";
import { Card } from "@/components/ui/Card";
import type { CelebrationEvent } from "@/lib/engine/celebrations";
import { formatUSD } from "@/lib/engine/utils";

function CelebrationRow({ event }: { event: CelebrationEvent }) {
  const isMilestone = event.kind === "debtMilestone";
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        {isMilestone ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 21h8M12 17v4M7 4h10l-1 8a4 4 0 0 1-8 0L7 4Z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {isMilestone ? `${formatUSD(event.milestoneAmount ?? 0)} paid off` : `${event.debtName} paid off in full`}
        </p>
        <p className="text-xs text-muted-foreground">{format(event.createdAt, "MMM d, yyyy")}</p>
      </div>
    </div>
  );
}

export function CelebrationHistory({ events }: { events: CelebrationEvent[] }) {
  const sorted = [...events].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <Card>
      <p className="text-sm font-semibold text-foreground">Achievements</p>
      {sorted.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Your milestones will show up here — every $500 paid off, and every account you bring to zero.
        </p>
      ) : (
        <div className="mt-1 divide-y divide-border">
          {sorted.map((event) => (
            <CelebrationRow key={event.id} event={event} />
          ))}
        </div>
      )}
    </Card>
  );
}
