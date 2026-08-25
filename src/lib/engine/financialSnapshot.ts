import { currentGoalStage, type GoalStageId } from "./goals";
import type { Debt } from "./debt";
import { currentTarget } from "./debtOrganizer";
import type { FinancialProfile } from "./financialProfile";
import { simulate, type PayoffPlan } from "./payoffCalculator";
import type { PayoffStrategy } from "./payoffStrategy";

/** A point-in-time snapshot of everything Zero knows about the user's
 * finances — the shared payload the Home, Debts, and Advice tabs all build
 * their views from, so every tab agrees on the same numbers. */
export interface FinancialSnapshot {
  profile: FinancialProfile;
  debts: Debt[];
  strategy: PayoffStrategy;
  extraMonthlyPayment: number;
  goalStage: GoalStageId;
  currentPlan?: PayoffPlan;
  referenceDate: Date;
  /** Derived from logged Wallet transactions, not a static setting —
   * see wallet.ts. */
  averageMonthlyIncome: number;
  averageMonthlyExpenses: number;
}

export function buildSnapshot(
  profile: FinancialProfile,
  debts: Debt[],
  strategy: PayoffStrategy,
  extraMonthlyPayment: number,
  averageMonthlyIncome: number,
  averageMonthlyExpenses: number,
  referenceDate: Date = new Date()
): FinancialSnapshot {
  const stage = currentGoalStage(profile, debts);
  let currentPlan: PayoffPlan | undefined;
  try {
    currentPlan = simulate(debts, strategy, extraMonthlyPayment, referenceDate);
  } catch {
    currentPlan = undefined;
  }
  return {
    profile,
    debts,
    strategy,
    extraMonthlyPayment,
    goalStage: stage,
    currentPlan,
    referenceDate,
    averageMonthlyIncome,
    averageMonthlyExpenses,
  };
}

export function focusDebt(snapshot: FinancialSnapshot): Debt | undefined {
  return currentTarget(snapshot.debts, snapshot.strategy);
}
