import { Card } from "@/components/ui/Card";
import { PAYOFF_STRATEGY_META, type PayoffStrategy } from "@/lib/engine/payoffStrategy";
import type { PayoffPlan } from "@/lib/engine/payoffCalculator";
import { formatUSD } from "@/lib/engine/utils";

export function StrategyComparisonCard({
  plans,
  activeStrategy,
}: {
  plans: Partial<Record<PayoffStrategy, PayoffPlan>>;
  activeStrategy: PayoffStrategy;
}) {
  const strategies: PayoffStrategy[] = ["snowball", "avalanche"];
  const hasAny = strategies.some((s) => plans[s]);
  if (!hasAny) return null;

  return (
    <Card>
      <p className="text-sm font-semibold text-foreground">Snowball vs. avalanche</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {strategies.map((strategy) => {
          const plan = plans[strategy];
          const active = strategy === activeStrategy;
          return (
            <div
              key={strategy}
              className={`rounded-2xl border p-3 ${active ? "border-primary bg-primary-soft/50" : "border-border"}`}
            >
              <p className={`text-xs font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
                {PAYOFF_STRATEGY_META[strategy].title}
                {active && " · active"}
              </p>
              {plan ? (
                <>
                  <p className="mt-1.5 text-lg font-semibold tabular-nums text-foreground">{plan.totalMonths}mo</p>
                  <p className="text-xs text-muted-foreground">{formatUSD(plan.totalInterestPaid)} interest</p>
                </>
              ) : (
                <p className="mt-1.5 text-xs text-muted-foreground">Not available</p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
