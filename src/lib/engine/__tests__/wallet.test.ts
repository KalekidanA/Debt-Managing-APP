import { describe, expect, it } from "vitest";
import {
  averageMonthlyAmount,
  buildFinancialStatement,
  estimatedInterestSinceLastPayment,
  lastPaymentFor,
  totalPaidTowardDebt,
  walletBalance,
  type WalletTransaction,
} from "../wallet";
import type { Debt } from "../debt";

function tx(overrides: Partial<WalletTransaction> & { id: string }): WalletTransaction {
  return {
    type: "income",
    amount: 0,
    date: new Date(2026, 0, 1),
    ...overrides,
  };
}

function makeDebt(overrides: Partial<Debt> & { id: string }): Debt {
  return {
    name: overrides.id,
    type: "creditCard",
    balance: 0,
    apr: 0.2,
    minimumPayment: 0,
    dueDayOfMonth: 1,
    ...overrides,
  };
}

describe("walletBalance", () => {
  it("adds income and subtracts expenses and debt payments", () => {
    const txs = [
      tx({ id: "1", type: "income", amount: 1000 }),
      tx({ id: "2", type: "expense", amount: 300 }),
      tx({ id: "3", type: "debtPayment", amount: 200, debtId: "card" }),
    ];
    expect(walletBalance(txs)).toBe(500);
  });

  it("adds adjustment (existing cash) entries just like income", () => {
    const txs = [tx({ id: "1", type: "adjustment", amount: 750 })];
    expect(walletBalance(txs)).toBe(750);
  });

  it("is zero with no transactions", () => {
    expect(walletBalance([])).toBe(0);
  });
});

describe("averageMonthlyAmount", () => {
  it("averages only across months that have entries of that type", () => {
    const txs = [
      tx({ id: "1", type: "income", amount: 1000, date: new Date(2026, 0, 5) }),
      tx({ id: "2", type: "income", amount: 3000, date: new Date(2026, 0, 20) }), // same month as above
      tx({ id: "3", type: "income", amount: 2000, date: new Date(2026, 2, 1) }), // a different month, Feb skipped entirely
    ];
    // Jan total = 4000, Mar total = 2000 -> average across the 2 months with data = 3000
    expect(averageMonthlyAmount(txs, "income")).toBe(3000);
  });

  it("returns 0 when there are no transactions of that type", () => {
    expect(averageMonthlyAmount([tx({ id: "1", type: "expense", amount: 50 })], "income")).toBe(0);
  });

  it("does not count adjustment (existing cash) entries toward the income average", () => {
    const txs = [
      tx({ id: "1", type: "adjustment", amount: 5000, date: new Date(2026, 0, 1) }),
      tx({ id: "2", type: "income", amount: 1000, date: new Date(2026, 0, 5) }),
    ];
    expect(averageMonthlyAmount(txs, "income")).toBe(1000);
  });
});

describe("buildFinancialStatement", () => {
  it("computes net income and cash available for debt after minimums", () => {
    const txs = [
      tx({ id: "1", type: "income", amount: 5000, date: new Date(2026, 0, 1) }),
      tx({ id: "2", type: "expense", amount: 3200, date: new Date(2026, 0, 2) }),
    ];
    const debts = [makeDebt({ id: "card", balance: 500, minimumPayment: 60 })];
    const statement = buildFinancialStatement(txs, debts);
    expect(statement.averageMonthlyIncome).toBe(5000);
    expect(statement.averageMonthlyExpenses).toBe(3200);
    expect(statement.netMonthlyIncome).toBe(1800);
    expect(statement.cashAvailableForDebt).toBe(1740);
    expect(statement.walletBalance).toBe(1800);
  });

  it("ignores paid-off debts' minimums", () => {
    const debts = [makeDebt({ id: "paid", balance: 0, minimumPayment: 100 })];
    const statement = buildFinancialStatement([], debts);
    expect(statement.cashAvailableForDebt).toBe(0);
  });
});

describe("totalPaidTowardDebt", () => {
  it("sums only debtPayment transactions for the given debt", () => {
    const txs = [
      tx({ id: "1", type: "debtPayment", amount: 100, debtId: "a" }),
      tx({ id: "2", type: "debtPayment", amount: 50, debtId: "b" }),
      tx({ id: "3", type: "debtPayment", amount: 25, debtId: "a" }),
      tx({ id: "4", type: "income", amount: 1000 }),
    ];
    expect(totalPaidTowardDebt(txs, "a")).toBe(125);
    expect(totalPaidTowardDebt(txs, "c")).toBe(0);
  });
});

describe("lastPaymentFor", () => {
  it("returns the most recent debtPayment transaction for the debt", () => {
    const txs = [
      tx({ id: "1", type: "debtPayment", amount: 50, debtId: "a", date: new Date(2026, 0, 1) }),
      tx({ id: "2", type: "debtPayment", amount: 60, debtId: "a", date: new Date(2026, 1, 1) }),
      tx({ id: "3", type: "debtPayment", amount: 999, debtId: "b", date: new Date(2026, 2, 1) }),
    ];
    expect(lastPaymentFor(txs, "a")?.id).toBe("2");
  });

  it("returns undefined when the debt has no logged payments", () => {
    expect(lastPaymentFor([], "a")).toBeUndefined();
  });
});

describe("estimatedInterestSinceLastPayment", () => {
  it("is 0 for a debt with no prior payment — there's no start date to measure from", () => {
    const debt = makeDebt({ id: "a", balance: 1000, apr: 0.24 });
    expect(estimatedInterestSinceLastPayment(debt, [], new Date(2026, 0, 31))).toBe(0);
  });

  it("accrues at the daily rate (apr/365) over real elapsed days since the last payment", () => {
    const debt = makeDebt({ id: "a", balance: 1000, apr: 0.365 }); // -> exactly 0.1%/day
    const txs = [tx({ id: "1", type: "debtPayment", amount: 50, debtId: "a", date: new Date(2026, 0, 1) })];
    const interest = estimatedInterestSinceLastPayment(debt, txs, new Date(2026, 0, 11)); // 10 days later
    expect(interest).toBe(10); // 1000 * 0.001 * 10
  });

  it("ignores payments logged toward other debts", () => {
    const debt = makeDebt({ id: "a", balance: 1000, apr: 0.365 });
    const txs = [tx({ id: "1", type: "debtPayment", amount: 999, debtId: "other", date: new Date(2026, 0, 1) })];
    expect(estimatedInterestSinceLastPayment(debt, txs, new Date(2026, 0, 11))).toBe(0);
  });
});
