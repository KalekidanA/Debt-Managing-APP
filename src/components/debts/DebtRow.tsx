"use client";

import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DEBT_TYPE_META, daysUntilNextDueDate, type Debt } from "@/lib/engine/debt";
import type { DebtPaymentRecommendation } from "@/lib/engine/payoffCalculator";
import { formatUSD } from "@/lib/engine/utils";

interface DebtRowProps {
  debt: Debt;
  isFocus: boolean;
  referenceDate: Date;
  paidTotal: number;
  /** This debt's share of the minimum + extra payment for the current
   * month, from currentMonthPaymentPlan — undefined for debts the payoff
   * plan doesn't cover (mortgage, already paid off). */
  recommendation?: DebtPaymentRecommendation;
  onClick: () => void;
  onLogPayment: () => void;
}

export function DebtRow({ debt, isFocus, referenceDate, paidTotal, recommendation, onClick, onLogPayment }: DebtRowProps) {
  const meta = DEBT_TYPE_META[debt.type];
  const daysLeft = daysUntilNextDueDate(debt, referenceDate);
  const progress = debt.originalBalance && debt.originalBalance > 0 ? 1 - debt.balance / debt.originalBalance : undefined;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className={`cursor-pointer transition-colors ${isFocus ? "border-primary/50 bg-primary-soft/40" : ""}`}
    >
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
          {debt.accountNickname && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {debt.accountNickname}
              {debt.accountLast4 && ` •••• ${debt.accountLast4}`}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums text-foreground">{formatUSD(debt.balance)}</p>
          {debt.balance > 0 && (
            <p className={`mt-0.5 text-xs tabular-nums ${daysLeft <= 3 ? "text-critical" : "text-muted-foreground"}`}>
              due in {daysLeft}d
            </p>
          )}
        </div>
      </div>
      {progress !== undefined && <ProgressBar value={progress} className="mt-3" />}
      {recommendation && (
        <div className="mt-3 rounded-xl bg-primary-soft/60 px-3 py-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-medium text-primary">Pay this month</p>
            <p className="text-sm font-semibold tabular-nums text-primary">
              {formatUSD(recommendation.recommendedPayment)}
            </p>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {formatUSD(recommendation.minimumDue)} minimum
            {recommendation.extraApplied > 0 ? ` + ${formatUSD(recommendation.extraApplied)} extra` : ""} · ≈
            {formatUSD(recommendation.estimatedMonthlyInterest)} interest this month
          </p>
        </div>
      )}
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {paidTotal > 0 ? `${formatUSD(paidTotal)} logged toward this debt` : "No payments logged yet"}
        </p>
        {debt.balance > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLogPayment();
            }}
            className="shrink-0 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary hover:brightness-95"
          >
            Log payment
          </button>
        )}
      </div>
    </Card>
  );
}
