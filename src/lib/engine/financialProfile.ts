import { clamp } from "./utils";

/** How much of the starter emergency fund goal has been saved. Income and
 * expenses are no longer tracked here as static settings — they're derived
 * from actual logged transactions on the Wallet tab (see wallet.ts), since
 * they change month to month for most people (a business owner especially)
 * and a single static number goes stale immediately. */
export interface FinancialProfile {
  emergencyFundSaved: number;
  /** The starter emergency fund target. Defaults to $1,000 but is kept
   * configurable in case the household situation calls for more. */
  emergencyFundTarget: number;
}

export const DEFAULT_FINANCIAL_PROFILE: FinancialProfile = {
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
