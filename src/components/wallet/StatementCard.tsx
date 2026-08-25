import { Card } from "@/components/ui/Card";
import type { FinancialStatement } from "@/lib/engine/wallet";
import { formatUSD } from "@/lib/engine/utils";

function Row({ label, value, emphasis, tone }: { label: string; value: number; emphasis?: boolean; tone?: "critical" }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={`text-sm ${emphasis ? "font-medium text-foreground" : "text-muted-foreground"}`}>{label}</span>
      <span
        className={`text-sm tabular-nums ${emphasis ? "font-semibold" : ""} ${
          tone === "critical" ? "text-critical" : "text-foreground"
        }`}
      >
        {value < 0 ? `-${formatUSD(Math.abs(value))}` : formatUSD(value)}
      </span>
    </div>
  );
}

export function StatementCard({ statement }: { statement: FinancialStatement }) {
  return (
    <Card>
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cash on hand</p>
      </div>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${statement.walletBalance < 0 ? "text-critical" : "text-foreground"}`}>
        {formatUSD(statement.walletBalance)}
      </p>

      <div className="mt-4 divide-y divide-border border-t border-border pt-1">
        <Row label="Avg. monthly income" value={statement.averageMonthlyIncome} />
        <Row label="Avg. monthly expenses" value={-statement.averageMonthlyExpenses} />
        <Row label="Net monthly income" value={statement.netMonthlyIncome} emphasis />
        <Row
          label="Cash available for debt"
          value={statement.cashAvailableForDebt}
          emphasis
          tone={statement.cashAvailableForDebt < 0 ? "critical" : undefined}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Averages are based on what you&apos;ve logged below, across every month with an entry — they&apos;ll keep
        adjusting as your income and expenses change.
      </p>
    </Card>
  );
}
