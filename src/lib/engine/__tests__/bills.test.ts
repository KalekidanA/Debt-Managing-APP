import { describe, expect, it } from "vitest";
import {
  amountPaidForBillInMonth,
  billsByCategory,
  isBillPaidInMonth,
  paymentsForBillInMonth,
  sortByNextDueDate,
  totalMonthlyBillsAmount,
  totalPaidThisMonth,
  type Bill,
} from "../bills";
import type { WalletTransaction } from "../wallet";

function bill(overrides: Partial<Bill> & { id: string }): Bill {
  return {
    name: overrides.id,
    category: "other",
    amount: 0,
    dueDayOfMonth: 1,
    ...overrides,
  };
}

function tx(overrides: Partial<WalletTransaction> & { id: string }): WalletTransaction {
  return {
    type: "expense",
    amount: 0,
    date: new Date(2026, 0, 1),
    ...overrides,
  };
}

describe("paymentsForBillInMonth / amountPaidForBillInMonth", () => {
  it("only counts expense transactions tagged with this bill in the given month", () => {
    const txs = [
      tx({ id: "1", type: "expense", amount: 15.99, date: new Date(2026, 0, 5), billId: "netflix" }),
      tx({ id: "2", type: "expense", amount: 12, date: new Date(2026, 0, 10), billId: "spotify" }),
      tx({ id: "3", type: "expense", amount: 15.99, date: new Date(2026, 1, 5), billId: "netflix" }),
      tx({ id: "4", type: "income", amount: 15.99, date: new Date(2026, 0, 5), billId: "netflix" }),
    ];
    expect(amountPaidForBillInMonth("netflix", txs, new Date(2026, 0, 20))).toBe(15.99);
    expect(paymentsForBillInMonth("netflix", txs, new Date(2026, 0, 20))).toHaveLength(1);
  });

  it("sums multiple payments toward the same bill in the same month", () => {
    const txs = [
      tx({ id: "1", type: "expense", amount: 50, date: new Date(2026, 0, 3), billId: "rent" }),
      tx({ id: "2", type: "expense", amount: 950, date: new Date(2026, 0, 4), billId: "rent" }),
    ];
    expect(amountPaidForBillInMonth("rent", txs, new Date(2026, 0, 20))).toBe(1000);
  });
});

describe("isBillPaidInMonth", () => {
  it("is false with no matching payments and true once one exists", () => {
    const txs = [tx({ id: "1", type: "expense", amount: 10, date: new Date(2026, 0, 5), billId: "gym" })];
    expect(isBillPaidInMonth("gym", [], new Date(2026, 0, 20))).toBe(false);
    expect(isBillPaidInMonth("gym", txs, new Date(2026, 0, 20))).toBe(true);
  });
});

describe("totalMonthlyBillsAmount / totalPaidThisMonth", () => {
  it("computes committed total independent of payment status, and paid total from the ledger", () => {
    const bills = [bill({ id: "rent", amount: 1000 }), bill({ id: "netflix", amount: 15.99 })];
    const txs = [tx({ id: "1", type: "expense", amount: 1000, date: new Date(2026, 0, 1), billId: "rent" })];
    expect(totalMonthlyBillsAmount(bills)).toBe(1015.99);
    expect(totalPaidThisMonth(bills, txs, new Date(2026, 0, 15))).toBe(1000);
  });
});

describe("billsByCategory", () => {
  it("groups bills by category in a fixed order, omitting empty categories", () => {
    const bills = [
      bill({ id: "netflix", category: "subscription" }),
      bill({ id: "rent", category: "housing" }),
      bill({ id: "spotify", category: "subscription" }),
    ];
    const groups = billsByCategory(bills);
    expect(groups.map((g) => g.category)).toEqual(["housing", "subscription"]);
    expect(groups.find((g) => g.category === "subscription")?.bills).toHaveLength(2);
  });
});

describe("sortByNextDueDate", () => {
  it("orders bills by how soon they're next due", () => {
    const reference = new Date(2026, 0, 10);
    const bills = [bill({ id: "late", dueDayOfMonth: 25 }), bill({ id: "soon", dueDayOfMonth: 12 })];
    expect(sortByNextDueDate(bills, reference).map((b) => b.id)).toEqual(["soon", "late"]);
  });
});
