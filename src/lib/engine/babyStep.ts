import type { Debt } from "./debt";
import type { FinancialProfile } from "./financialProfile";
import { isEmergencyFundComplete } from "./financialProfile";

/** Dave Ramsey's 7 Baby Steps. Zero actively coaches steps 1 and 2 (starter
 * emergency fund, then the debt snowball); steps 3-7 are surfaced as
 * context/motivation for what comes after the debt is gone. */
export type BabyStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const BABY_STEP_TITLES: Record<BabyStep, string> = {
  1: "Save a $1,000 starter emergency fund",
  2: "Pay off all debt (except the house) using the debt snowball",
  3: "Save 3-6 months of expenses in a full emergency fund",
  4: "Invest 15% of household income for retirement",
  5: "Save for your children's college fund",
  6: "Pay off your home early",
  7: "Build wealth and give generously",
};

export function isActivelyCoachedByZero(step: BabyStep): boolean {
  return step === 1 || step === 2;
}

/** Determines the household's current Baby Step from their profile and
 * debt list. Zero only has visibility into steps 1-2 in detail, so anything
 * past a cleared snowball is reported as step 3 without further precision
 * (the app doesn't track retirement/college/mortgage payoff data). */
export function currentBabyStep(profile: FinancialProfile, debts: Debt[]): BabyStep {
  if (!isEmergencyFundComplete(profile)) return 1;
  const snowballDebts = debts.filter((d) => d.type !== "mortgage" && d.balance > 0);
  if (snowballDebts.length > 0) return 2;
  return 3;
}
