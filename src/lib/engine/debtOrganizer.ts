import { countsTowardSnowball, type Debt } from "./debt";
import type { PayoffStrategy } from "./payoffStrategy";

/** Orders debts according to a payoff strategy. Only debts that count
 * toward the snowball (i.e. not the primary mortgage) are considered by
 * default — callers who want the mortgage included (Baby Step 6 planning)
 * can pass `includeMortgage: true`. */
export function orderDebts(debts: Debt[], strategy: PayoffStrategy, includeMortgage = false): Debt[] {
  const eligible = debts.filter((d) => d.balance > 0 && (includeMortgage || countsTowardSnowball(d.type)));
  return [...eligible].sort((a, b) => {
    if (strategy === "snowball") {
      if (a.balance !== b.balance) return a.balance - b.balance;
      if (a.apr !== b.apr) return b.apr - a.apr;
    } else {
      if (a.apr !== b.apr) return b.apr - a.apr;
      if (a.balance !== b.balance) return a.balance - b.balance;
    }
    return a.id.localeCompare(b.id);
  });
}

/** The single debt the user should be focusing every extra dollar on right
 * now, per the chosen strategy. */
export function currentTarget(debts: Debt[], strategy: PayoffStrategy): Debt | undefined {
  return orderDebts(debts, strategy)[0];
}
