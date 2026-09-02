import { differenceInCalendarDays, format } from "date-fns";
import type { Debt } from "./debt";
import { round2 } from "./utils";

/** A single entry in the user's cash register: money that came in, money
 * that went out, a payment made toward a specific debt, or an adjustment
 * (existing cash you already had, entered once to start the balance
 * accurately). This is the only source of truth for the wallet balance and
 * for the "average monthly income/expenses" figures shown on the Wallet
 * tab — there's no separate static income/expense setting anywhere else in
 * the app.
 *
 * "adjustment" is deliberately its own type rather than reusing "income":
 * existing cash isn't something you earned that month, so counting it as
 * income would inflate the average-monthly-income figure. */
export type WalletTransactionType = "income" | "expense" | "debtPayment" | "adjustment";

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
  date: Date;
  note?: string;
  /** Set only when type === "debtPayment". */
  debtId?: string;
  debtName?: string;
  /** Set only when this expense is a payment toward a recurring Bill —
   * lets the Bills tracker derive "paid this month" straight from the
   * ledger instead of keeping its own separate paid/unpaid state. */
  billId?: string;
  billName?: string;
  /** Set only when type === "debtPayment": how much of `amount` covered
   * interest accrued since the previous payment on this debt, rather than
   * reducing principal. See `estimatedInterestSinceLastPayment`. */
  interestPortion?: number;
}

/** Current cash on hand: income and adjustments (existing cash) add,
 * expenses and debt payments subtract. */
export function walletBalance(transactions: WalletTransaction[]): number {
  return round2(
    transactions.reduce((sum, t) => {
      if (t.type === "income" || t.type === "adjustment") return sum + t.amount;
      return sum - t.amount;
    }, 0)
  );
}

function monthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

/** Average monthly amount for a transaction type, averaged only across
 * calendar months that actually have at least one entry of that type —
 * so a gap month doesn't drag the average toward zero, and it keeps
 * adjusting automatically as new entries come in (useful for variable
 * income, e.g. running a business). Returns 0 if there are no matching
 * transactions at all. */
export function averageMonthlyAmount(transactions: WalletTransaction[], type: "income" | "expense"): number {
  const matching = transactions.filter((t) => t.type === type);
  if (matching.length === 0) return 0;
  const totalsByMonth = new Map<string, number>();
  for (const t of matching) {
    const key = monthKey(t.date);
    totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + t.amount);
  }
  const monthTotals = [...totalsByMonth.values()];
  return round2(monthTotals.reduce((sum, v) => sum + v, 0) / monthTotals.length);
}

export interface FinancialStatement {
  averageMonthlyIncome: number;
  averageMonthlyExpenses: number;
  netMonthlyIncome: number;
  /** Net income minus everyone's minimum debt payments — what's
   * realistically left over each month to put extra toward debt. */
  cashAvailableForDebt: number;
  walletBalance: number;
}

export function buildFinancialStatement(transactions: WalletTransaction[], debts: Debt[]): FinancialStatement {
  const averageMonthlyIncome = averageMonthlyAmount(transactions, "income");
  const averageMonthlyExpenses = averageMonthlyAmount(transactions, "expense");
  const netMonthlyIncome = round2(averageMonthlyIncome - averageMonthlyExpenses);
  const totalMinimums = round2(debts.reduce((sum, d) => sum + (d.balance > 0 ? d.minimumPayment : 0), 0));
  return {
    averageMonthlyIncome,
    averageMonthlyExpenses,
    netMonthlyIncome,
    cashAvailableForDebt: round2(netMonthlyIncome - totalMinimums),
    walletBalance: walletBalance(transactions),
  };
}

/** Total logged toward a specific debt via debtPayment transactions —
 * used by the Debts tab to show real payment progress, independent of
 * whatever the user has typed as the debt's "original balance". */
export function totalPaidTowardDebt(transactions: WalletTransaction[], debtId: string): number {
  return round2(
    transactions
      .filter((t) => t.type === "debtPayment" && t.debtId === debtId)
      .reduce((sum, t) => sum + t.amount, 0)
  );
}

/** The most recent debtPayment transaction logged against a debt, or
 * undefined if none has ever been logged. */
export function lastPaymentFor(transactions: WalletTransaction[], debtId: string): WalletTransaction | undefined {
  return transactions
    .filter((t) => t.type === "debtPayment" && t.debtId === debtId)
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
}

/** Interest a debt has actually accrued (at its daily rate, apr/365) over
 * the real calendar days since its last logged payment — used so logging a
 * payment isn't just a flat subtraction from the balance: the accrued
 * interest is added back first, and only what's left of the payment
 * reduces principal. Returns 0 for a debt's very first payment, since
 * there's no prior payment date to measure from — Zero can't know how
 * long the entered balance had already been accruing before that. */
export function estimatedInterestSinceLastPayment(
  debt: Pick<Debt, "id" | "apr" | "balance">,
  transactions: WalletTransaction[],
  referenceDate: Date
): number {
  const last = lastPaymentFor(transactions, debt.id);
  if (!last) return 0;
  const days = Math.max(0, differenceInCalendarDays(referenceDate, last.date));
  return round2(debt.balance * (debt.apr / 365) * days);
}
