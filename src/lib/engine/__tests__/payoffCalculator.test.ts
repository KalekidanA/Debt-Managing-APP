import { describe, expect, it } from "vitest";
import type { Debt } from "../debt";
import {
  currentMonthPaymentPlan,
  DoesNotConvergeError,
  impactOfExtraPayment,
  interestSavedVersusMinimumOnly,
  simulate,
} from "../payoffCalculator";
import { round2 } from "../utils";

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

describe("currentMonthPaymentPlan", () => {
  it("recommends just the minimum for debts with no extra allocated to them", () => {
    const small = makeDebt({ id: "small", balance: 300, apr: 0.1, minimumPayment: 30 });
    const big = makeDebt({ id: "big", balance: 2000, apr: 0.2, minimumPayment: 60 });
    const plan = currentMonthPaymentPlan([small, big], "snowball", 100);
    const bigLine = plan.find((l) => l.debtId === "big")!;
    expect(bigLine.extraApplied).toBe(0);
    expect(bigLine.recommendedPayment).toBe(60);
  });

  it("cascades the extra payment to the snowball-first (smallest balance) debt", () => {
    const small = makeDebt({ id: "small", balance: 300, apr: 0.1, minimumPayment: 30 });
    const big = makeDebt({ id: "big", balance: 2000, apr: 0.2, minimumPayment: 60 });
    const plan = currentMonthPaymentPlan([small, big], "snowball", 100);
    const smallLine = plan.find((l) => l.debtId === "small")!;
    expect(smallLine.extraApplied).toBe(100);
    expect(smallLine.recommendedPayment).toBe(130);
  });

  it("cascades to the highest-APR debt under avalanche instead", () => {
    const low = makeDebt({ id: "low-apr", balance: 500, apr: 0.06, minimumPayment: 40 });
    const high = makeDebt({ id: "high-apr", balance: 1500, apr: 0.28, minimumPayment: 45 });
    const plan = currentMonthPaymentPlan([low, high], "avalanche", 100);
    expect(plan.find((l) => l.debtId === "high-apr")!.extraApplied).toBe(100);
    expect(plan.find((l) => l.debtId === "low-apr")!.extraApplied).toBe(0);
  });

  it("estimates monthly interest at the monthly rate (apr/12) on the current balance", () => {
    const debt = makeDebt({ id: "card", balance: 1200, apr: 0.12, minimumPayment: 50 });
    const plan = currentMonthPaymentPlan([debt], "snowball", 0);
    expect(plan[0].estimatedMonthlyInterest).toBe(12); // 1200 * (0.12/12)
  });

  it("never recommends paying more than the remaining balance plus interest", () => {
    const small = makeDebt({ id: "small", balance: 50, apr: 0.1, minimumPayment: 25 });
    const plan = currentMonthPaymentPlan([small], "snowball", 1000);
    expect(plan[0].recommendedPayment).toBeLessThanOrEqual(round2(50 + 50 * (0.1 / 12)));
  });

  it("returns an empty plan when there are no active debts", () => {
    expect(currentMonthPaymentPlan([], "snowball", 100)).toEqual([]);
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
