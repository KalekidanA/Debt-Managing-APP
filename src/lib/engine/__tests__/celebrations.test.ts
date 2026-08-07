import { describe, expect, it } from "vitest";
import { detectNewMilestones, detectNewlyPaidOffDebts } from "../celebrations";
import type { Debt } from "../debt";

function makeDebt(overrides: Partial<Debt> & { id: string }): Debt {
  return {
    name: overrides.id,
    type: "creditCard",
    balance: 0,
    apr: 0,
    minimumPayment: 25,
    dueDayOfMonth: 1,
    ...overrides,
  };
}

describe("detectNewMilestones", () => {
  it("fires when crossing a single $500 threshold", () => {
    expect(detectNewMilestones(300, 600)).toEqual([500]);
  });

  it("fires for every threshold crossed by a big jump", () => {
    expect(detectNewMilestones(0, 1600)).toEqual([500, 1000, 1500]);
  });

  it("does not fire when staying within the same $500 bracket", () => {
    expect(detectNewMilestones(100, 400)).toEqual([]);
  });

  it("does not fire when progress goes backwards (e.g. a new debt added)", () => {
    expect(detectNewMilestones(600, 300)).toEqual([]);
  });

  it("does not re-fire exactly at a threshold already reached", () => {
    expect(detectNewMilestones(500, 500)).toEqual([]);
  });
});

describe("detectNewlyPaidOffDebts", () => {
  it("returns a debt that went from a positive balance to zero", () => {
    const before = [makeDebt({ id: "a", balance: 50 })];
    const after = [makeDebt({ id: "a", balance: 0 })];
    expect(detectNewlyPaidOffDebts(before, after).map((d) => d.id)).toEqual(["a"]);
  });

  it("ignores debts that were already at zero", () => {
    const before = [makeDebt({ id: "a", balance: 0 })];
    const after = [makeDebt({ id: "a", balance: 0 })];
    expect(detectNewlyPaidOffDebts(before, after)).toEqual([]);
  });

  it("ignores debts still above zero", () => {
    const before = [makeDebt({ id: "a", balance: 50 })];
    const after = [makeDebt({ id: "a", balance: 10 })];
    expect(detectNewlyPaidOffDebts(before, after)).toEqual([]);
  });

  it("ignores a mortgage reaching zero", () => {
    const before = [makeDebt({ id: "house", type: "mortgage", balance: 1000 })];
    const after = [makeDebt({ id: "house", type: "mortgage", balance: 0 })];
    expect(detectNewlyPaidOffDebts(before, after)).toEqual([]);
  });

  it("ignores a brand-new debt that starts at zero", () => {
    const before: Debt[] = [];
    const after = [makeDebt({ id: "a", balance: 0 })];
    expect(detectNewlyPaidOffDebts(before, after)).toEqual([]);
  });
});
