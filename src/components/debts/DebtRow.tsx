"use client";

import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DEBT_TYPE_META, daysUntilNextDueDate, type Debt } from "@/lib/engine/debt";
import { formatUSD } from "@/lib/engine/utils";

interface DebtRowProps {
  debt: Debt;
  isFocus: boolean;
  referenceDate: Date;
  onClick: () => void;
}

export function DebtRow({ debt, isFocus, referenceDate, onClick }: DebtRowProps) {
  const meta = DEBT_TYPE_META[debt.type];
  const daysLeft = daysUntilNextDueDate(debt, referenceDate);

  return (
    <button onClick={onClick} className="block w-full text-left">
      <Card className={`transition-colors ${isFocus ? "border-primary/50 bg-primary-soft/40" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{debt.name}</p>
              {isFocus && (
                <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Paying next
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {meta.displayName} · {(debt.apr * 100).toFixed(2)}% APR
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums text-foreground">{formatUSD(debt.balance)}</p>
            <p className={`mt-0.5 text-xs tabular-nums ${daysLeft <= 3 ? "text-critical" : "text-muted-foreground"}`}>
              due in {daysLeft}d
            </p>
          </div>
        </div>
        {debt.originalBalance && debt.originalBalance > 0 && (
          <ProgressBar value={1 - debt.balance / debt.originalBalance} className="mt-3" />
        )}
      </Card>
    </button>
  );
}
