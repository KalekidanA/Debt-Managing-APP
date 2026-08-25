import { format } from "date-fns";
import { Card } from "@/components/ui/Card";
import type { WalletTransaction } from "@/lib/engine/wallet";
import { formatUSD } from "@/lib/engine/utils";

function TypeIcon({ type }: { type: WalletTransaction["type"] }) {
  if (type === "income") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    );
  }
  if (type === "expense") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12l7 7 7-7" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="2.2" />
      <path d="M7 15h4" />
    </svg>
  );
}

const TYPE_TONE: Record<WalletTransaction["type"], string> = {
  income: "bg-primary-soft text-primary",
  expense: "bg-critical-soft text-critical",
  debtPayment: "bg-warning-soft text-warning",
};

interface TransactionHistoryProps {
  transactions: WalletTransaction[];
  onDelete: (id: string) => void;
}

export function TransactionHistory({ transactions, onDelete }: TransactionHistoryProps) {
  const sorted = [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <Card>
      <p className="text-sm font-semibold text-foreground">History</p>
      {sorted.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing logged yet. Add your first income or expense above.
        </p>
      ) : (
        <div className="mt-1 divide-y divide-border">
          {sorted.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TYPE_TONE[t.type]}`}>
                <TypeIcon type={t.type} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {t.type === "debtPayment" ? `Payment to ${t.debtName}` : t.note || (t.type === "income" ? "Income" : "Expense")}
                </p>
                <p className="text-xs text-muted-foreground">{format(t.date, "MMM d, yyyy")}</p>
              </div>
              <p className={`shrink-0 text-sm font-semibold tabular-nums ${t.type === "income" ? "text-primary" : "text-foreground"}`}>
                {t.type === "income" ? "+" : "-"}
                {formatUSD(t.amount)}
              </p>
              {t.type !== "debtPayment" && (
                <button
                  onClick={() => onDelete(t.id)}
                  aria-label="Delete"
                  className="shrink-0 text-muted-foreground hover:text-critical"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
