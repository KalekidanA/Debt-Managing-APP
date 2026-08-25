"use client";

import { format } from "date-fns";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatTile } from "@/components/ui/StatTile";
import { EmptyDebtsPrompt } from "@/components/home/EmptyDebtsPrompt";
import { ProfileSetupForm } from "@/components/onboarding/ProfileSetupForm";
import { goalStage, nextGoalStage, type GoalStageId } from "@/lib/engine/goals";
import { daysUntilNextDueDate, type Debt } from "@/lib/engine/debt";
import type { DebtPayoffResult, PayoffPlan } from "@/lib/engine/payoffCalculator";
import { emergencyFundProgress, emergencyFundRemaining } from "@/lib/engine/financialProfile";
import type { FinancialStatement } from "@/lib/engine/wallet";
import { formatUSD } from "@/lib/engine/utils";
import { useAppState } from "@/lib/state/AppStateContext";
import { useFinancials } from "@/lib/state/useFinancials";

function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const { state, isLoaded } = useAppState();

  if (!isLoaded) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading Zero…</div>
      </AppShell>
    );
  }

  if (!state.hasCompletedOnboarding) {
    return (
      <AppShell>
        <ProfileSetupForm />
      </AppShell>
    );
  }

  return <Dashboard />;
}

function Dashboard() {
  const { state } = useAppState();
  const {
    orderedDebts,
    currentPlan,
    savingsVsMinimum,
    totalDebt,
    totalPaidSoFar,
    debtPaidOffProgress,
    referenceDate,
    snapshot,
    financialStatement,
  } = useFinancials();
  const stage = snapshot.goalStage;
  const next = nextGoalStage(stage);
  const hasDebts = state.debts.length > 0;
  const activeDebts = state.debts.filter((d) => d.type !== "mortgage" && d.balance > 0);
  const hasUnresolvedDebt = activeDebts.length > 0 && !currentPlan;

  return (
    <AppShell>
      <header className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{format(referenceDate, "EEEE, MMMM d")}</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">{getGreeting(referenceDate)}</h1>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-primary-soft"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
        </Link>
      </header>

      <div className="flex flex-col gap-4">
        <HeroCard
          stage={stage}
          fundProgress={emergencyFundProgress(state.profile)}
          fundRemaining={emergencyFundRemaining(state.profile)}
          debtPaidOffProgress={debtPaidOffProgress}
          totalMonths={currentPlan?.totalMonths}
          debtFreeDate={currentPlan?.debtFreeDate}
          hasUnresolvedDebt={hasUnresolvedDebt}
        />

        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current goal</p>
              <p className="truncate text-sm font-medium text-foreground">{goalStage(stage).title}</p>
            </div>
          </div>
          {next && (
            <div className="flex items-center gap-3 border-t border-border pt-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next goal</p>
                <p className="truncate text-sm text-muted-foreground">{goalStage(next.id).title}</p>
              </div>
            </div>
          )}
        </Card>

        <FinancialSnapshotCard statement={financialStatement} />

        {!hasDebts && <EmptyDebtsPrompt />}

        {hasDebts && (
          <UpNextCard debts={orderedDebts} currentPlan={currentPlan} referenceDate={referenceDate} />
        )}

        {hasDebts && (
          <PayoffProgressCard totalPaidSoFar={totalPaidSoFar} totalDebt={totalDebt} progress={debtPaidOffProgress} />
        )}

        {hasDebts && (
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Debt-free"
              value={currentPlan ? format(currentPlan.debtFreeDate, "MMM yyyy") : "—"}
              hint={currentPlan ? `${currentPlan.totalMonths} months away` : undefined}
            />
            <StatTile
              label="Interest saved"
              value={savingsVsMinimum ? formatUSD(savingsVsMinimum.interestSaved) : "—"}
              hint="vs. minimums only"
            />
          </div>
        )}

        {hasUnresolvedDebt && (
          <Card className="border-warning-soft bg-warning-soft/60">
            <p className="text-sm font-medium text-warning">One of your debts needs attention</p>
            <p className="mt-1 text-sm text-muted-foreground">
              A minimum payment is lower than the interest that debt accrues each month, so Zero can&apos;t project a
              payoff date until it&apos;s fixed.
            </p>
            <Link href="/debts" className="mt-2 inline-block text-sm font-medium text-primary">
              Review your debts →
            </Link>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function HeroCard({
  stage,
  fundProgress,
  fundRemaining,
  debtPaidOffProgress,
  totalMonths,
  debtFreeDate,
  hasUnresolvedDebt,
}: {
  stage: GoalStageId;
  fundProgress: number;
  fundRemaining: number;
  debtPaidOffProgress: number;
  totalMonths: number | undefined;
  debtFreeDate: Date | undefined;
  hasUnresolvedDebt: boolean;
}) {
  if (stage === "starterSafetyNet") {
    return (
      <Card className="flex flex-col items-center py-8 text-center">
        <ProgressRing value={fundProgress}>
          <span className="text-2xl font-semibold tabular-nums text-foreground">{formatUSD(fundRemaining)}</span>
          <span className="text-xs text-muted-foreground">left to save</span>
        </ProgressRing>
        <p className="mt-4 text-sm text-muted-foreground">Building your starter safety net</p>
      </Card>
    );
  }

  if (stage === "debtFree" && totalMonths !== undefined && debtFreeDate) {
    return (
      <Card className="flex flex-col items-center py-8 text-center">
        <ProgressRing value={debtPaidOffProgress}>
          <span className="text-2xl font-semibold tabular-nums text-foreground">{totalMonths}</span>
          <span className="text-xs text-muted-foreground">{totalMonths === 1 ? "month left" : "months left"}</span>
        </ProgressRing>
        <p className="mt-4 text-sm text-muted-foreground">Debt-free around {format(debtFreeDate, "MMMM yyyy")}</p>
      </Card>
    );
  }

  if (stage === "debtFree" && hasUnresolvedDebt) {
    return (
      <Card className="flex flex-col items-center py-8 text-center">
        <ProgressRing value={0}>
          <span className="text-3xl font-semibold text-foreground">?</span>
        </ProgressRing>
        <p className="mt-4 text-sm text-muted-foreground">Fix a debt below to see your payoff timeline</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col items-center py-8 text-center">
      <ProgressRing value={1}>
        <span className="text-xl font-semibold text-foreground">Debt-free</span>
      </ProgressRing>
      <p className="mt-4 text-sm text-muted-foreground">No consumer debt left. On to your next goal.</p>
    </Card>
  );
}

function FinancialSnapshotCard({ statement }: { statement: FinancialStatement }) {
  return (
    <Link href="/wallet" className="block">
      <Card className="transition-colors hover:border-primary/40">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Financial snapshot</p>
          <span className="text-xs font-medium text-primary">Wallet →</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Cash on hand</p>
            <p className={`mt-0.5 text-sm font-semibold tabular-nums ${statement.walletBalance < 0 ? "text-critical" : "text-foreground"}`}>
              {formatUSD(statement.walletBalance)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Net income</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{formatUSD(statement.netMonthlyIncome)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">For debt</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{formatUSD(statement.cashAvailableForDebt)}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function UpNextCard({
  debts,
  currentPlan,
  referenceDate,
}: {
  debts: Debt[];
  currentPlan: PayoffPlan | undefined;
  referenceDate: Date;
}) {
  const upNext = debts.slice(0, 3);
  if (upNext.length === 0) return null;
  const resultFor = (id: string): DebtPayoffResult | undefined => currentPlan?.perDebtResults.find((r) => r.debtId === id);

  return (
    <Card>
      <p className="text-sm font-semibold text-foreground">Up next</p>
      <div className="mt-1 divide-y divide-border">
        {upNext.map((debt, i) => {
          const result = resultFor(debt.id);
          const daysLeft = daysUntilNextDueDate(debt, referenceDate);
          return (
            <div key={debt.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[10px] font-semibold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{debt.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatUSD(debt.balance)} remaining
                    {i === 0 && (
                      <span className={daysLeft <= 3 ? "text-critical" : undefined}> · due in {daysLeft}d</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted-foreground">Paid off by</p>
                <p className="text-sm font-medium text-foreground">{result ? format(result.payoffDate, "MMM yyyy") : "—"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function PayoffProgressCard({
  totalPaidSoFar,
  totalDebt,
  progress,
}: {
  totalPaidSoFar: number;
  totalDebt: number;
  progress: number;
}) {
  return (
    <Card>
      <p className="text-sm font-semibold text-foreground">Debt payments</p>
      <ProgressBar value={progress} className="mt-3" />
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-primary">{formatUSD(totalPaidSoFar)} paid</span>
        <span className="text-muted-foreground">{formatUSD(totalDebt)} left</span>
      </div>
    </Card>
  );
}
