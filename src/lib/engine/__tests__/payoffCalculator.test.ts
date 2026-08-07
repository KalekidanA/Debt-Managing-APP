import { describe, expect, it } from "vitest";
import type { Debt } from "../debt";
import {
  DoesNotConvergeError,
  impactOfExtraPayment,
  interestSavedVersusMinimumOnly,
  simulate,
} from "../payoffCalculator";

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

describe("simulate", () => {
  it("pays off a 0% APR debt in exact months with no interest", () => {
    const debt = makeDebt({ id: "zero-apr", type: "personalLoan", balance: 1200, apr: 0, minimumPayment: 100 });
    const plan = simulate([debt], "snowball", 0);
    expect(plan.totalMonths).toBe(12);
    expect(plan.totalInterestPaid).toBe(0);
    expect(plan.totalPaid).toBe(1200);
    expect(plan.perDebtResults[0].monthsToPayoff).toBe(12);
  });

  it("throws DoesNotConvergeError when the minimum is below monthly interest", () => {
    // 24% APR => 2% monthly interest on $1000 = $20/mo; a $10 minimum can never catch up.
    const debt = makeDebt({ id: "underwater", balance: 1000, apr: 0.24, minimumPayment: 10 });
    expect(() => simulate([debt], "snowball", 0)).toThrow(DoesNotConvergeError);
  });

  it("snowball attacks the smallest balance first and cascades freed-up payments", () => {
    const small = makeDebt({ id: "small", balance: 300, apr: 0.1, minimumPayment: 30 });
    const big = makeDebt({ id: "big", balance: 2000, apr: 0.2, minimumPayment: 60 });
    const plan = simulate([small, big], "snowball", 100);

    expect(plan.payoffOrder[0]).toBe("small");

    const bigAlonePlan = simulate([big], "snowball", 100);
    const bigResult = plan.perDebtResults.find((r) => r.debtId === "big")!;
    expect(bigResult.monthsToPayoff).toBeLessThanOrEqual(bigAlonePlan.totalMonths);
  });

  it("avalanche never pays more total interest than snowball for the same inputs", () => {
    const low = makeDebt({ id: "low-apr", type: "autoLoan", balance: 500, apr: 0.06, minimumPayment: 40 });
    const high = makeDebt({ id: "high-apr", balance: 1500, apr: 0.28, minimumPayment: 45 });
    const snowball = simulate([low, high], "snowball", 150);
    const avalanche = simulate([low, high], "avalanche", 150);
    expect(avalanche.totalInterestPaid).toBeLessThanOrEqual(snowball.totalInterestPaid);
  });
});

describe("interestSavedVersusMinimumOnly", () => {
  it("is positive when an extra payment is applied", () => {
    const debt = makeDebt({ id: "card", balance: 3000, apr: 0.22, minimumPayment: 90 });
    const saved = interestSavedVersusMinimumOnly([debt], "snowball", 200);
    expect(saved).toBeDefined();
    expect(saved!.interestSaved).toBeGreaterThan(0);
    expect(saved!.monthsSaved).toBeGreaterThan(0);
  });
});

describe("impactOfExtraPayment", () => {
  it("shows a faster payoff and less interest with more extra payment", () => {
    const debt = makeDebt({ id: "card", balance: 3000, apr: 0.22, minimumPayment: 90 });
    const basePlan = simulate([debt], "snowball", 100);
    const impact = impactOfExtraPayment(200, basePlan, [debt]);
    expect(impact).toBeDefined();
    expect(impact!.monthsDelta).toBeLessThan(0);
    expect(impact!.interestDelta).toBeLessThan(0);
  });
});
