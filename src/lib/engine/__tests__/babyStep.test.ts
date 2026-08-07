import { describe, expect, it } from "vitest";
import { currentBabyStep } from "../babyStep";
import type { Debt } from "../debt";
import { DEFAULT_FINANCIAL_PROFILE } from "../financialProfile";

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

describe("currentBabyStep", () => {
  it("is step 1 when the emergency fund is incomplete", () => {
    const profile = { ...DEFAULT_FINANCIAL_PROFILE, emergencyFundSaved: 200 };
    expect(currentBabyStep(profile, [])).toBe(1);
  });

  it("is step 2 when the fund is complete and debts remain", () => {
    const profile = { ...DEFAULT_FINANCIAL_PROFILE, emergencyFundSaved: 1000 };
    const debt = makeDebt({ id: "card", balance: 500, apr: 0.2 });
    expect(currentBabyStep(profile, [debt])).toBe(2);
  });

  it("is step 3 when the fund is complete and only a mortgage remains", () => {
    const profile = { ...DEFAULT_FINANCIAL_PROFILE, emergencyFundSaved: 1000 };
    const mortgage = makeDebt({ id: "house", type: "mortgage", balance: 200_000, apr: 0.06 });
    expect(currentBabyStep(profile, [mortgage])).toBe(3);
  });

  it("is step 3 when remaining debts are already paid off", () => {
    const profile = { ...DEFAULT_FINANCIAL_PROFILE, emergencyFundSaved: 1000 };
    const clearedCard = makeDebt({ id: "old-card", balance: 0, apr: 0.2 });
    expect(currentBabyStep(profile, [clearedCard])).toBe(3);
  });
});
