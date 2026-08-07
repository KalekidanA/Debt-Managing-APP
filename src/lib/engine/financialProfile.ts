import { clamp } from "./utils";

/** The user's overall financial picture: what comes in, what goes out, and
 * how much of Baby Step 1's starter emergency fund has been saved. */
export interface FinancialProfile {
  monthlyIncome: number;
  monthlyExpenses: number;
  emergencyFundSaved: number;
  /** Dave Ramsey's starter emergency fund target (Baby Step 1). Kept
   * configurable in case the household situation calls for more. */
  emergencyFundTarget: number;
}

export const DEFAULT_FINANCIAL_PROFILE: FinancialProfile = {
  monthlyIncome: 0,
  monthlyExpenses: 0,
  emergencyFundSaved: 0,
  emergencyFundTarget: 1000,
};

export function isEmergencyFundComplete(profile: FinancialProfile): boolean {
  return profile.emergencyFundSaved >= profile.emergencyFundTarget;
}

export function emergencyFundRemaining(profile: FinancialProfile): number {
  return Math.max(profile.emergencyFundTarget - profile.emergencyFundSaved, 0);
}

export function emergencyFundProgress(profile: FinancialProfile): number {
  if (profile.emergencyFundTarget <= 0) return 1;
  return clamp(profile.emergencyFundSaved / profile.emergencyFundTarget, 0, 1);
}

/** Income left over after fixed monthly expenses — the pool available for
 * emergency-fund savings or extra debt payments, before minimum debt
 * payments are subtracted. */
export function monthlySurplus(profile: FinancialProfile): number {
  return profile.monthlyIncome - profile.monthlyExpenses;
}
