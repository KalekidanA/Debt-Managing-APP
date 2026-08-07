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
import { BABY_STEP_TITLES } from "@/lib/engine/babyStep";
import { DEBT_TYPE_META, daysUntilNextDueDate } from "@/lib/engine/debt";
import { emergencyFundProgress, emergencyFundRemaining } from "@/lib/engine/financialProfile";
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
  const { focusDebt, currentPlan, savingsVsMinimum, totalDebt, debtPaidOffProgress, referenceDate, snapshot } =
    useFinancials();
  const babyStep = snapshot.babyStep;
  const hasDebts = state.debts.length > 0;
  const activeDebts = state.debts.filter((d) => d.type !== "mortgage" && d.balance > 0);
  const hasUnresolvedDebt = activeDebts.length > 0 && !currentPlan;

  return (
    <AppShell>
      <header className="mb-5">
        <p className="text-sm text-muted-foreground">{format(referenceDate, "EEEE, MMMM d")}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">{getGreeting(referenceDate)}</h1>
      </header>

      <div className="flex flex-col gap-4">
        <HeroCard
          babyStep={babyStep}
          fundProgress={emergencyFundProgress(state.profile)}
          fundRemaining={emergencyFundRemaining(state.profile)}
          debtPaidOffProgress={debtPaidOffProgress}
          totalMonths={currentPlan?.totalMonths}
          debtFreeDate={currentPlan?.debtFreeDate}
          hasUnresolvedDebt={hasUnresolvedDebt}
        />

        <Card className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
            {babyStep}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Baby Step {babyStep}</p>
            <p className="truncate text-sm font-medium text-foreground">{BABY_STEP_TITLES[babyStep]}</p>
          </div>
        </Card>

        {!hasDebts && <EmptyDebtsPrompt />}

        {hasDebts && focusDebt && babyStep === 2 && <FocusDebtCard debtId={focusDebt.id} referenceDate={referenceDate} />}

        {hasDebts && (
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Total debt" value={formatUSD(totalDebt)} />
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
            <StatTile label="Paid off" value={`${Math.round(debtPaidOffProgress * 100)}%`} hint="of peak debt" />
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
  babyStep,
  fundProgress,
  fundRemaining,
  debtPaidOffProgress,
  totalMonths,
  debtFreeDate,
  hasUnresolvedDebt,
}: {
  babyStep: number;
  fundProgress: number;
  fundRemaining: number;
  debtPaidOffProgress: number;
  totalMonths: number | undefined;
  debtFreeDate: Date | undefined;
  hasUnresolvedDebt: boolean;
}) {
  if (babyStep === 1) {
    return (
      <Card className="flex flex-col items-center py-8 text-center">
        <ProgressRing value={fundProgress}>
          <span className="text-2xl font-semibold tabular-nums text-foreground">{formatUSD(fundRemaining)}</span>
          <span className="text-xs text-muted-foreground">left to save</span>
        </ProgressRing>
        <p className="mt-4 text-sm text-muted-foreground">Starter emergency fund — Baby Step 1</p>
      </Card>
    );
  }

  if (babyStep === 2 && totalMonths !== undefined && debtFreeDate) {
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

  if (babyStep === 2 && hasUnresolvedDebt) {
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
      <p className="mt-4 text-sm text-muted-foreground">No consumer debt left. On to Baby Step {babyStep}.</p>
    </Card>
  );
}

function FocusDebtCard({ debtId, referenceDate }: { debtId: string; referenceDate: Date }) {
  const { state } = useAppState();
  const debt = state.debts.find((d) => d.id === debtId);
  if (!debt) return null;
  const daysLeft = daysUntilNextDueDate(debt, referenceDate);
  const meta = DEBT_TYPE_META[debt.type];

  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Your focus debt</p>
        <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
          {meta.displayName}
        </span>
      </div>
      <p className="mt-1.5 text-lg font-semibold text-foreground">{debt.name}</p>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className="text-base font-semibold tabular-nums text-foreground">{formatUSD(debt.balance)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Payment due</p>
          <p className={`text-base font-semibold tabular-nums ${daysLeft <= 3 ? "text-critical" : "text-foreground"}`}>
            {daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft} days`}
          </p>
        </div>
      </div>
      {debt.originalBalance && debt.originalBalance > 0 && (
        <ProgressBar value={1 - debt.balance / debt.originalBalance} className="mt-4" />
      )}
    </Card>
  );
}
