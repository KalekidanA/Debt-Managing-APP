import { addMonths, differenceInCalendarDays, getDaysInMonth, setDate, startOfDay } from "date-fns";
import { clamp } from "./utils";

/** The kind of debt a user is carrying. Mortgages are tracked separately
 * from "consumer debt" — the house is paid off on its own timeline, after
 * the rest of the debt snowball is cleared. */
export type DebtType =
  | "creditCard"
  | "autoLoan"
  | "studentLoan"
  | "personalLoan"
  | "medicalDebt"
  | "mortgage"
  | "other";

export const DEBT_TYPE_META: Record<DebtType, { displayName: string; icon: string }> = {
  creditCard: { displayName: "Credit Card", icon: "credit-card" },
  autoLoan: { displayName: "Auto Loan", icon: "car" },
  studentLoan: { displayName: "Student Loan", icon: "graduation-cap" },
  personalLoan: { displayName: "Personal Loan", icon: "id-card" },
  medicalDebt: { displayName: "Medical Debt", icon: "briefcase-medical" },
  mortgage: { displayName: "Mortgage", icon: "home" },
  other: { displayName: "Other Debt", icon: "file-text" },
};

/** The debt snowball excludes the primary mortgage — it's paid off on its
 * own, separate timeline. */
export function countsTowardSnowball(type: DebtType): boolean {
  return type !== "mortgage";
}

export interface Debt {
  id: string;
  name: string;
  type: DebtType;
  balance: number;
  /** Annual percentage rate expressed as a fraction, e.g. 0.2499 for 24.99%. */
  apr: number;
  minimumPayment: number;
  /** Day of month (1-31) the payment is due. Clamped to the length of
   * whatever month is being evaluated. */
  dueDayOfMonth: number;
  creditLimit?: number;
  originalBalance?: number;
  notes?: string;
  /** A friendly label for the account the payment comes out of, e.g.
   * "Chase Checking" — not the debt account itself. */
  accountNickname?: string;
  /** Last 4 digits only, for recognition — never the full account/card
   * number. */
  accountLast4?: string;
}

export function monthlyInterestRate(debt: Pick<Debt, "apr">): number {
  return debt.apr / 12;
}

export function estimatedDailyInterest(debt: Pick<Debt, "apr" | "balance">): number {
  if (debt.apr <= 0) return 0;
  return debt.balance * (debt.apr / 365);
}

export function utilization(debt: Debt): number | undefined {
  if (debt.type !== "creditCard" || !debt.creditLimit || debt.creditLimit <= 0) return undefined;
  return debt.balance / debt.creditLimit;
}

export function progressPaidOff(debt: Debt): number | undefined {
  if (!debt.originalBalance || debt.originalBalance <= 0) return undefined;
  const paid = debt.originalBalance - debt.balance;
  return clamp(paid / debt.originalBalance, 0, 1);
}

/** The next occurrence of `dueDayOfMonth` on/after `from`. */
export function nextDueDate(debt: Pick<Debt, "dueDayOfMonth">, from: Date = new Date()): Date {
  const today = startOfDay(from);
  for (let offset = 0; offset <= 1; offset++) {
    const candidateMonth = addMonths(today, offset);
    const daysInMonth = getDaysInMonth(candidateMonth);
    const day = Math.min(debt.dueDayOfMonth, daysInMonth);
    const candidate = startOfDay(setDate(candidateMonth, day));
    if (candidate.getTime() >= today.getTime()) return candidate;
  }
  return today;
}

/** Days until the next occurrence of `dueDayOfMonth`, relative to `from`. */
export function daysUntilNextDueDate(debt: Pick<Debt, "dueDayOfMonth">, from: Date = new Date()): number {
  const today = startOfDay(from);
  const due = nextDueDate(debt, from);
  return differenceInCalendarDays(due, today);
}

export function clampDueDayOfMonth(day: number): number {
  return clamp(Math.round(day), 1, 31);
}
