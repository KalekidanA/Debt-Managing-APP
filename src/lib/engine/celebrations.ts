import type { Debt } from "./debt";

/** A moment worth celebrating: crossing a $500 cumulative debt-paid-off
 * milestone, or fully retiring an individual account. Pure data — the app
 * layer decides how/when to show it. */
export interface CelebrationEvent {
  id: string;
  kind: "debtMilestone" | "debtPaidOff";
  /** Set when kind === "debtMilestone": the cumulative dollar amount just crossed (500, 1000, 1500, ...). */
  milestoneAmount?: number;
  /** Set when kind === "debtPaidOff": the debt that just hit zero. */
  debtId?: string;
  debtName?: string;
  createdAt: Date;
  seen: boolean;
}

export const MILESTONE_STEP = 500;

/** Given how much total debt had been paid off before and after a change,
 * returns every $500 threshold newly crossed (there can be more than one
 * if a single edit pays down a large chunk at once). Paying off less, or
 * adding new debt (which can make "paid off so far" go down), returns
 * nothing — milestones only fire on forward progress. */
export function detectNewMilestones(previousPaidOff: number, newPaidOff: number, step = MILESTONE_STEP): number[] {
  const prevCount = Math.floor(Math.max(previousPaidOff, 0) / step);
  const newCount = Math.floor(Math.max(newPaidOff, 0) / step);
  if (newCount <= prevCount) return [];
  const milestones: number[] = [];
  for (let i = prevCount + 1; i <= newCount; i++) milestones.push(i * step);
  return milestones;
}

/** Debts that had a positive balance before a change and are at or below
 * zero after it — i.e. just got fully paid off. Mortgages are excluded;
 * paying off the house isn't a "debt zero" snowball moment the same way. */
export function detectNewlyPaidOffDebts(previousDebts: Debt[], newDebts: Debt[]): Debt[] {
  return newDebts.filter((debt) => {
    if (debt.type === "mortgage" || debt.balance > 0) return false;
    const before = previousDebts.find((d) => d.id === debt.id);
    return (before?.balance ?? 0) > 0;
  });
}
