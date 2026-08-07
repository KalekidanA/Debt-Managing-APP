import { describe, expect, it } from "vitest";
import { currentGoalStage, goalStageIndex, nextGoalStage } from "../goals";
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

describe("currentGoalStage", () => {
  it("is the starter safety net goal when the emergency fund is incomplete", () => {
    const profile = { ...DEFAULT_FINANCIAL_PROFILE, emergencyFundSaved: 200 };
    expect(currentGoalStage(profile, [])).toBe("starterSafetyNet");
  });

  it("is the debt-free goal when the fund is complete and debts remain", () => {
    const profile = { ...DEFAULT_FINANCIAL_PROFILE, emergencyFundSaved: 1000 };
    const debt = makeDebt({ id: "card", balance: 500, apr: 0.2 });
    expect(currentGoalStage(profile, [debt])).toBe("debtFree");
  });

  it("is the full safety net goal when the fund is complete and only a mortgage remains", () => {
    const profile = { ...DEFAULT_FINANCIAL_PROFILE, emergencyFundSaved: 1000 };
    const mortgage = makeDebt({ id: "house", type: "mortgage", balance: 200_000, apr: 0.06 });
    expect(currentGoalStage(profile, [mortgage])).toBe("fullSafetyNet");
  });

  it("is the full safety net goal when remaining debts are already paid off", () => {
    const profile = { ...DEFAULT_FINANCIAL_PROFILE, emergencyFundSaved: 1000 };
    const clearedCard = makeDebt({ id: "old-card", balance: 0, apr: 0.2 });
    expect(currentGoalStage(profile, [clearedCard])).toBe("fullSafetyNet");
  });
});

describe("goal stage sequencing", () => {
  it("orders stages starterSafetyNet -> debtFree -> fullSafetyNet", () => {
    expect(goalStageIndex("starterSafetyNet")).toBe(0);
    expect(goalStageIndex("debtFree")).toBe(1);
    expect(goalStageIndex("fullSafetyNet")).toBe(2);
  });

  it("nextGoalStage returns the following stage, or undefined at the end", () => {
    expect(nextGoalStage("starterSafetyNet")?.id).toBe("debtFree");
    expect(nextGoalStage("debtFree")?.id).toBe("fullSafetyNet");
    expect(nextGoalStage("fullSafetyNet")).toBeUndefined();
  });
});
