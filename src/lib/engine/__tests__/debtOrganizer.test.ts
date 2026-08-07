import { describe, expect, it } from "vitest";
import type { Debt } from "../debt";
import { orderDebts } from "../debtOrganizer";

function makeDebt(overrides: Partial<Debt> & { id: string }): Debt {
  return {
    name: overrides.id,
    type: "creditCard",
    balance: 0,
    apr: 0,
    minimumPayment: 25,
    dueDayOfMonth: 15,
    ...overrides,
  };
}

describe("orderDebts", () => {
  it("snowball orders by smallest balance first", () => {
    const small = makeDebt({ id: "small", balance: 300, apr: 0.05 });
    const big = makeDebt({ id: "big", balance: 1000, apr: 0.3 });
    const ordered = orderDebts([big, small], "snowball");
    expect(ordered.map((d) => d.id)).toEqual(["small", "big"]);
  });

  it("avalanche orders by highest APR first", () => {
    const small = makeDebt({ id: "small", balance: 300, apr: 0.05 });
    const big = makeDebt({ id: "big", balance: 1000, apr: 0.3 });
    const ordered = orderDebts([small, big], "avalanche");
    expect(ordered.map((d) => d.id)).toEqual(["big", "small"]);
  });

  it("excludes the mortgage by default", () => {
    const mortgage = makeDebt({ id: "house", type: "mortgage", balance: 200_000, apr: 0.06 });
    const card = makeDebt({ id: "card", balance: 500, apr: 0.2 });
    const ordered = orderDebts([mortgage, card], "snowball");
    expect(ordered.map((d) => d.id)).toEqual(["card"]);
  });

  it("excludes debts that are already paid off", () => {
    const paidOff = makeDebt({ id: "paid", balance: 0, apr: 0.2 });
    const active = makeDebt({ id: "active", balance: 400, apr: 0.1 });
    const ordered = orderDebts([paidOff, active], "snowball");
    expect(ordered.map((d) => d.id)).toEqual(["active"]);
  });
});
