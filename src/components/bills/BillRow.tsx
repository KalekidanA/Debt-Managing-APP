"use client";

import { Card } from "@/components/ui/Card";
import { BILL_CATEGORY_META, type Bill } from "@/lib/engine/bills";
import { daysUntilNextDueDate } from "@/lib/engine/debt";
import { formatUSD } from "@/lib/engine/utils";

interface BillRowProps {
  bill: Bill;
  referenceDate: Date;
  paidThisMonth: number;
  onClick: () => void;
  onMarkPaid: () => void;
}

export function BillRow({ bill, referenceDate, paidThisMonth, onClick, onMarkPaid }: BillRowProps) {
  const daysLeft = daysUntilNextDueDate(bill, referenceDate);
  const paid = paidThisMonth > 0;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className="cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{bill.name}</p>
            {paid && (
              <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary">
                Paid
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {BILL_CATEGORY_META[bill.category].displayName}
            {bill.interestRate ? ` · ${(bill.interestRate * 100).toFixed(2)}% APR` : ""}
          </p>
          {bill.accountNickname && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {bill.accountNickname}
              {bill.accountLast4 && ` •••• ${bill.accountLast4}`}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums text-foreground">{formatUSD(bill.amount)}</p>
          <p className={`mt-0.5 text-xs tabular-nums ${!paid && daysLeft <= 3 ? "text-critical" : "text-muted-foreground"}`}>
            {daysLeft === 0 ? "due today" : `due in ${daysLeft}d`}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {paid ? `${formatUSD(paidThisMonth)} paid this month` : "Not paid yet this month"}
        </p>
        {!paid && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkPaid();
            }}
            className="shrink-0 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary hover:brightness-95"
          >
            Mark paid
          </button>
        )}
      </div>
    </Card>
  );
}
