import type { Debt } from "./debt";
import type { FinancialProfile } from "./financialProfile";
import { isEmergencyFundComplete } from "./financialProfile";

/** The three stages of financial progress Zero actively tracks, in order.
 * Zero can precisely determine which of these a household is in from the
 * data it has (emergency fund + debts); it doesn't try to fabricate
 * precision about anything further out (retirement, college, an early
 * mortgage payoff), which is why the list stops here. */
export type GoalStageId = "starterSafetyNet" | "debtFree" | "fullSafetyNet";

export interface GoalStage {
  id: GoalStageId;
  title: string;
  description: string;
}

export const GOAL_STAGES: GoalStage[] = [
  {
    id: "starterSafetyNet",
    title: "Build a starter safety net",
    description: "Save up a small cash cushion so a surprise expense doesn't turn into new debt.",
  },
  {
    id: "debtFree",
    title: "Become debt-free",
    description: "Pay off every credit card and loan (except your mortgage), smallest balance first.",
  },
  {
    id: "fullSafetyNet",
    title: "Build a full safety net",
    description: "Grow your emergency fund to a few months of expenses, then put every extra dollar toward your future.",
  },
];

export function goalStage(id: GoalStageId): GoalStage {
  return GOAL_STAGES.find((g) => g.id === id)!;
}

export function goalStageIndex(id: GoalStageId): number {
  return GOAL_STAGES.findIndex((g) => g.id === id);
}

export function nextGoalStage(id: GoalStageId): GoalStage | undefined {
  return GOAL_STAGES[goalStageIndex(id) + 1];
}

/** Determines the household's current goal stage from their profile and
 * debt list. */
export function currentGoalStage(profile: FinancialProfile, debts: Debt[]): GoalStageId {
  if (!isEmergencyFundComplete(profile)) return "starterSafetyNet";
  const snowballDebts = debts.filter((d) => d.type !== "mortgage" && d.balance > 0);
  if (snowballDebts.length > 0) return "debtFree";
  return "fullSafetyNet";
}
