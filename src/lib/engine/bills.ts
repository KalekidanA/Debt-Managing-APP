import { format } from "date-fns";
import { daysUntilNextDueDate } from "./debt";
import { round2 } from "./utils";
import type { WalletTransaction } from "./wallet";

/** A recurring, non-debt monthly expense: rent, utilities, subscriptions,
 * insurance, and the like. Unlike a Debt there's no balance to pay down —
 * just a monthly amount due on a recurring day. Whether a bill has been
 * paid for the current month is never stored on the bill itself; it's
 * derived from the wallet ledger (see `paymentsForBillInMonth`), the same
 * "one source of truth" pattern used for debt payments. */
export type BillCategory = "housing" | "utilities" | "subscription" | "insurance" | "transportation" | "other";

export const BILL_CATEGORY_META: Record<BillCategory, { displayName: string }> = {
  housing: { displayName: "Housing" },
  utilities: { displayName: "Utilities" },
  subscription: { displayName: "Subscriptions" },
  insurance: { displayName: "Insurance" },
  transportation: { displayName: "Transportation" },
  other: { displayName: "Other" },
};

const CATEGORY_ORDER: BillCategory[] = ["housing", "utilities", "subscription", "insurance", "transportation", "other"];

export interface Bill {
  id: string;
  name: string;
  category: BillCategory;
  /** Expected amount due each month. */
  amount: number;
  /** Day of month (1-31) the bill is due. Clamped to the length of
   * whatever month is being evaluated. */
  dueDayOfMonth: number;
  /** A friendly label for the account it's paid from, e.g. "Chase
   * Checking" — and its last 4 digits only, never the full number. */
  accountNickname?: string;
  accountLast4?: string;
  /** Rare for a bill (most have none) — e.g. a financed purchase paid
   * off in installments. Expressed as a fraction, e.g. 0.0599 for 5.99%. */
  interestRate?: number;
  notes?: string;
}

function monthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

/** Wallet expense transactions logged against this bill in the calendar
 * month of `referenceDate`. */
export function paymentsForBillInMonth(
  billId: string,
  transactions: WalletTransaction[],
  referenceDate: Date
): WalletTransaction[] {
  const key = monthKey(referenceDate);
  return transactions.filter((t) => t.type === "expense" && t.billId === billId && monthKey(t.date) === key);
}

export function amountPaidForBillInMonth(billId: string, transactions: WalletTransaction[], referenceDate: Date): number {
  return round2(
    paymentsForBillInMonth(billId, transactions, referenceDate).reduce((sum, t) => sum + t.amount, 0)
  );
}

export function isBillPaidInMonth(billId: string, transactions: WalletTransaction[], referenceDate: Date): boolean {
  return amountPaidForBillInMonth(billId, transactions, referenceDate) > 0;
}

/** Total committed monthly bills — what you owe each month regardless of
 * what's been paid so far, useful as a standing budget number even before
 * anything this month has been marked paid. */
export function totalMonthlyBillsAmount(bills: Bill[]): number {
  return round2(bills.reduce((sum, b) => sum + b.amount, 0));
}

export function totalPaidThisMonth(bills: Bill[], transactions: WalletTransaction[], referenceDate: Date): number {
  return round2(bills.reduce((sum, b) => sum + amountPaidForBillInMonth(b.id, transactions, referenceDate), 0));
}

export function billsByCategory(bills: Bill[]): { category: BillCategory; bills: Bill[] }[] {
  return CATEGORY_ORDER.map((category) => ({ category, bills: bills.filter((b) => b.category === category) })).filter(
    (group) => group.bills.length > 0
  );
}

export function sortByNextDueDate(bills: Bill[], referenceDate: Date): Bill[] {
  return [...bills].sort((a, b) => daysUntilNextDueDate(a, referenceDate) - daysUntilNextDueDate(b, referenceDate));
}
