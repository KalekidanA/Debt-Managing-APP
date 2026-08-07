import { addMonths } from "date-fns";
import { countsTowardSnowball, type Debt } from "./debt";
import { orderDebts } from "./debtOrganizer";
import type { PayoffStrategy } from "./payoffStrategy";
import { round2 } from "./utils";

export interface DebtPayoffResult {
  debtId: string;
  monthsToPayoff: number;
  payoffDate: Date;
  totalInterestPaid: number;
  totalPaid: number;
}

export interface MonthlySnapshot {
  monthIndex: number;
  date: Date;
  totalRemainingBalance: number;
  totalInterestPaidThisMonth: number;
  totalPaidThisMonth: number;
}

export interface PayoffPlan {
  strategy: PayoffStrategy;
  startDate: Date;
  debtFreeDate: Date;
  totalMonths: number;
  totalInterestPaid: number;
  totalPaid: number;
  perDebtResults: DebtPayoffResult[];
  monthlySnapshots: MonthlySnapshot[];
  /** Debt IDs in the order they get fully paid off. */
  payoffOrder: string[];
}

export class NoDebtsError extends Error {
  constructor() {
    super("No active debts to simulate.");
    this.name = "NoDebtsError";
  }
}

/** At least one debt's minimum payment doesn't even cover its monthly
 * interest — balance would grow forever regardless of extra payments. */
export class DoesNotConvergeError extends Error {
  constructor(public debtId: string) {
    super(`Debt ${debtId} does not converge: minimum payment is below its monthly interest.`);
    this.name = "DoesNotConvergeError";
  }
}

export class ExceededMaxMonthsError extends Error {
  constructor() {
    super("Simulation exceeded the maximum number of months.");
    this.name = "ExceededMaxMonthsError";
  }
}

/** Simulates paying down `debts` under a strategy, applying
 * `extraMonthlyPayment` on top of everyone's minimums to whichever debt is
 * currently first in the strategy's order. As each debt is retired, its
 * minimum payment rolls into the pool attacking the next one — the
 * "snowball" effect (this applies identically for avalanche ordering). */
export function simulate(
  debts: Debt[],
  strategy: PayoffStrategy,
  extraMonthlyPayment: number,
  startDate: Date = new Date(),
  maxMonths = 600
): PayoffPlan {
  const activeDebts = debts.filter((d) => countsTowardSnowball(d.type) && d.balance > 0);
  if (activeDebts.length === 0) throw new NoDebtsError();

  for (const debt of activeDebts) {
    const monthlyInterest = debt.balance * (debt.apr / 12);
    if (debt.minimumPayment < monthlyInterest) throw new DoesNotConvergeError(debt.id);
  }

  const orderedIds = orderDebts(activeDebts, strategy).map((d) => d.id);
  const balances = new Map(activeDebts.map((d) => [d.id, d.balance]));
  const minimums = new Map(activeDebts.map((d) => [d.id, d.minimumPayment]));
  const monthlyRates = new Map(activeDebts.map((d) => [d.id, d.apr / 12]));

  const interestPaid = new Map(activeDebts.map((d) => [d.id, 0]));
  const totalPaidPerDebt = new Map(activeDebts.map((d) => [d.id, 0]));
  const payoffMonth = new Map<string, number>();
  const payoffOrder: string[] = [];
  const snapshots: MonthlySnapshot[] = [];

  let month = 0;
  let freedUpPayment = 0;

  const hasRemaining = () => orderedIds.some((id) => (balances.get(id) ?? 0) > 0);

  while (hasRemaining()) {
    month += 1;
    if (month > maxMonths) throw new ExceededMaxMonthsError();

    let interestThisMonth = 0;
    for (const id of orderedIds) {
      const bal = balances.get(id)!;
      if (bal <= 0) continue;
      const rate = monthlyRates.get(id)!;
      const interest = round2(bal * rate);
      balances.set(id, round2(bal + interest));
      interestPaid.set(id, round2(interestPaid.get(id)! + interest));
      interestThisMonth += interest;
    }

    let paidThisMonth = 0;

    // Pass 1: minimum payments on every active debt.
    for (const id of orderedIds) {
      const bal = balances.get(id)!;
      if (bal <= 0) continue;
      const due = Math.min(minimums.get(id)!, bal);
      balances.set(id, round2(bal - due));
      totalPaidPerDebt.set(id, round2(totalPaidPerDebt.get(id)! + due));
      paidThisMonth += due;
    }

    // Pass 2: cascade the extra pool through the ordered debts, paying off
    // (and moving past) any that zero out mid-month.
    let pool = extraMonthlyPayment + freedUpPayment;
    for (const id of orderedIds) {
      if (pool <= 0) break;
      const remaining = balances.get(id)!;
      if (remaining <= 0) continue;
      const applied = Math.min(pool, remaining);
      balances.set(id, round2(remaining - applied));
      totalPaidPerDebt.set(id, round2(totalPaidPerDebt.get(id)! + applied));
      paidThisMonth += applied;
      pool -= applied;
    }

    // Record any debts fully retired this month.
    for (const id of orderedIds) {
      if (!payoffMonth.has(id) && (balances.get(id) ?? 0) <= 0) {
        payoffMonth.set(id, month);
        payoffOrder.push(id);
        freedUpPayment += minimums.get(id)!;
      }
    }

    const totalRemaining = orderedIds.reduce((sum, id) => sum + Math.max(balances.get(id)!, 0), 0);
    snapshots.push({
      monthIndex: month,
      date: addMonths(startDate, month),
      totalRemainingBalance: round2(totalRemaining),
      totalInterestPaidThisMonth: round2(interestThisMonth),
      totalPaidThisMonth: round2(paidThisMonth),
    });
  }

  const perDebtResults: DebtPayoffResult[] = orderedIds.map((id) => {
    const months = payoffMonth.get(id) ?? month;
    return {
      debtId: id,
      monthsToPayoff: months,
      payoffDate: addMonths(startDate, months),
      totalInterestPaid: round2(interestPaid.get(id)!),
      totalPaid: round2(totalPaidPerDebt.get(id)!),
    };
  });

  return {
    strategy,
    startDate,
    debtFreeDate: addMonths(startDate, month),
    totalMonths: month,
    totalInterestPaid: round2([...interestPaid.values()].reduce((a, b) => a + b, 0)),
    totalPaid: round2([...totalPaidPerDebt.values()].reduce((a, b) => a + b, 0)),
    perDebtResults,
    monthlySnapshots: snapshots,
    payoffOrder,
  };
}

/** Runs both strategies with the same extra payment and returns whichever
 * succeeded, for side-by-side comparison on the Advice tab. Strategies that
 * don't converge are simply omitted rather than thrown. */
export function compareStrategies(
  debts: Debt[],
  extraMonthlyPayment: number,
  startDate: Date = new Date()
): Partial<Record<PayoffStrategy, PayoffPlan>> {
  const results: Partial<Record<PayoffStrategy, PayoffPlan>> = {};
  for (const strategy of ["snowball", "avalanche"] as PayoffStrategy[]) {
    try {
      results[strategy] = simulate(debts, strategy, extraMonthlyPayment, startDate);
    } catch {
      // omit strategies that don't converge
    }
  }
  return results;
}

/** How much interest (and time) the extra payment is saving versus paying
 * only minimums. Returns `undefined` if the minimums-only scenario doesn't
 * converge, which is itself important for the Advice tab to surface as a
 * warning. */
export function interestSavedVersusMinimumOnly(
  debts: Debt[],
  strategy: PayoffStrategy,
  extraMonthlyPayment: number,
  startDate: Date = new Date()
): { interestSaved: number; monthsSaved: number } | undefined {
  if (extraMonthlyPayment <= 0) return undefined;
  try {
    const withExtra = simulate(debts, strategy, extraMonthlyPayment, startDate);
    const minimumOnly = simulate(debts, strategy, 0, startDate);
    return {
      interestSaved: round2(minimumOnly.totalInterestPaid - withExtra.totalInterestPaid),
      monthsSaved: minimumOnly.totalMonths - withExtra.totalMonths,
    };
  } catch {
    return undefined;
  }
}

/** Reruns the simulation with a modified extra payment to answer "what if
 * I paid $X more/less per month?" — used by the Advice and AI tabs to
 * quantify the cost of a decision in months and dollars. */
export function impactOfExtraPayment(
  newExtraMonthlyPayment: number,
  basePlan: PayoffPlan,
  debts: Debt[]
): { monthsDelta: number; interestDelta: number } | undefined {
  try {
    const newPlan = simulate(debts, basePlan.strategy, newExtraMonthlyPayment, basePlan.startDate);
    return {
      monthsDelta: newPlan.totalMonths - basePlan.totalMonths,
      interestDelta: round2(newPlan.totalInterestPaid - basePlan.totalInterestPaid),
    };
  } catch {
    return undefined;
  }
}
