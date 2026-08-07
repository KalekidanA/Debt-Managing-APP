import { currentGoalStage, goalStage, type GoalStageId } from "./goals";
import type { Debt } from "./debt";
import { currentTarget, orderDebts } from "./debtOrganizer";
import type { FinancialProfile } from "./financialProfile";
import { simulate, type PayoffPlan } from "./payoffCalculator";
import type { PayoffStrategy } from "./payoffStrategy";
import { format } from "date-fns";

/** A point-in-time snapshot of everything Zero knows about the user's
 * finances — the payload the AI tab hands to whatever advisor
 * implementation is behind `AIAdvisorService` (mock today, a real Claude
 * API call later). */
export interface FinancialSnapshot {
  profile: FinancialProfile;
  debts: Debt[];
  strategy: PayoffStrategy;
  extraMonthlyPayment: number;
  goalStage: GoalStageId;
  currentPlan?: PayoffPlan;
  referenceDate: Date;
}

export function buildSnapshot(
  profile: FinancialProfile,
  debts: Debt[],
  strategy: PayoffStrategy,
  extraMonthlyPayment: number,
  referenceDate: Date = new Date()
): FinancialSnapshot {
  const stage = currentGoalStage(profile, debts);
  let currentPlan: PayoffPlan | undefined;
  try {
    currentPlan = simulate(debts, strategy, extraMonthlyPayment, referenceDate);
  } catch {
    currentPlan = undefined;
  }
  return { profile, debts, strategy, extraMonthlyPayment, goalStage: stage, currentPlan, referenceDate };
}

export function focusDebt(snapshot: FinancialSnapshot): Debt | undefined {
  return currentTarget(snapshot.debts, snapshot.strategy);
}

/** Renders the snapshot as plain text suitable for use as system-prompt
 * context when this is wired up to a real LLM (e.g. the Claude API).
 * Keeping this as a standalone function means the mock and the future real
 * implementation both build their context the same way. */
export function systemPromptContext(snapshot: FinancialSnapshot): string {
  const lines: string[] = [];
  lines.push(`Current goal: ${goalStage(snapshot.goalStage).title}`);
  lines.push(`Monthly income: $${snapshot.profile.monthlyIncome}, monthly expenses: $${snapshot.profile.monthlyExpenses}`);
  lines.push(`Emergency fund: $${snapshot.profile.emergencyFundSaved} of $${snapshot.profile.emergencyFundTarget}`);
  lines.push(`Strategy: ${snapshot.strategy}, extra monthly payment: $${snapshot.extraMonthlyPayment}`);
  if (snapshot.currentPlan) {
    lines.push(
      `Projected debt-free date: ${format(snapshot.currentPlan.debtFreeDate, "MMM d, yyyy")} (${snapshot.currentPlan.totalMonths} months), total remaining interest: $${snapshot.currentPlan.totalInterestPaid}`
    );
  }
  lines.push("Debts:");
  for (const debt of orderDebts(snapshot.debts, snapshot.strategy)) {
    lines.push(
      `- ${debt.name} (${debt.type}): balance $${debt.balance}, APR ${(debt.apr * 100).toFixed(2)}%, minimum $${debt.minimumPayment}, due day ${debt.dueDayOfMonth}`
    );
  }
  return lines.join("\n");
}
