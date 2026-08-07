"use client";

import { AppShell, PageHeader } from "@/components/AppShell";
import { AdviceTipCard } from "@/components/advice/AdviceTipCard";
import { BudgetBreakdownCard } from "@/components/advice/BudgetBreakdownCard";
import { StrategyComparisonCard } from "@/components/advice/StrategyComparisonCard";
import { Card } from "@/components/ui/Card";
import { computeBudget, generateAdvice } from "@/lib/engine/adviceEngine";
import { useAppState } from "@/lib/state/AppStateContext";
import { useFinancials } from "@/lib/state/useFinancials";

export default function AdvicePage() {
  const { isLoaded, state } = useAppState();
  const { snapshot, plans } = useFinancials();

  if (!isLoaded) return null;

  if (!state.hasCompletedOnboarding) {
    return (
      <AppShell>
        <PageHeader title="Advice" />
        <Card className="py-8 text-center text-sm text-muted-foreground">
          Finish setting up your profile on the Home tab first.
        </Card>
      </AppShell>
    );
  }

  const budget = computeBudget(snapshot);
  const tips = generateAdvice(snapshot, budget);

  return (
    <AppShell>
      <PageHeader title="Advice" subtitle="What actually moves the needle, based on your numbers." />
      <div className="flex flex-col gap-4">
        <BudgetBreakdownCard budget={budget} />
        {snapshot.goalStage === "debtFree" && <StrategyComparisonCard plans={plans} activeStrategy={snapshot.strategy} />}
        {tips.length === 0 ? (
          <Card className="py-8 text-center text-sm text-muted-foreground">
            Add a debt and your budget details to get personalized advice.
          </Card>
        ) : (
          tips.map((tip) => <AdviceTipCard key={tip.id} tip={tip} />)
        )}
      </div>
    </AppShell>
  );
}
