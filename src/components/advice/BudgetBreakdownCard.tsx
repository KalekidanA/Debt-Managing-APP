import { Card } from "@/components/ui/Card";
import type { BudgetBreakdown } from "@/lib/engine/adviceEngine";
import { formatUSD } from "@/lib/engine/utils";

function Row({ label, value, emphasis }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={`text-sm ${emphasis ? "font-medium text-foreground" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-sm tabular-nums ${emphasis ? "font-semibold text-foreground" : "text-foreground"}`}>
        {value < 0 ? `-${formatUSD(Math.abs(value))}` : formatUSD(value)}
      </span>
    </div>
  );
}

export function BudgetBreakdownCard({ budget }: { budget: BudgetBreakdown }) {
  return (
    <Card>
      <p className="text-sm font-semibold text-foreground">Where your money goes each month</p>
      <div className="mt-2 divide-y divide-border">
        <Row label="Income" value={budget.monthlyIncome} />
        <Row label="Bills & expenses" value={-budget.monthlyExpenses} />
        <Row label="Debt minimums" value={-budget.totalMinimums} />
        <Row label="Extra payment" value={-budget.extraMonthlyPayment} />
        <Row label={budget.unallocated >= 0 ? "Unassigned" : "Over budget"} value={budget.unallocated} emphasis />
      </div>
    </Card>
  );
}
