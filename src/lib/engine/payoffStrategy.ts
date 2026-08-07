/** The order in which debts get attacked. Zero defaults to "snowball"
 * (Dave Ramsey's recommendation: smallest balance first, for behavioral
 * momentum) but supports "avalanche" (highest interest rate first, for
 * mathematically minimal interest paid) as an alternative. */
export type PayoffStrategy = "snowball" | "avalanche";

export const PAYOFF_STRATEGIES: PayoffStrategy[] = ["snowball", "avalanche"];

export const PAYOFF_STRATEGY_META: Record<PayoffStrategy, { title: string; summary: string }> = {
  snowball: {
    title: "Debt Snowball",
    summary:
      "Pay off debts smallest balance to largest, regardless of interest rate. Builds momentum with quick wins — Dave Ramsey's recommended default.",
  },
  avalanche: {
    title: "Debt Avalanche",
    summary:
      "Pay off debts highest interest rate to lowest, regardless of balance. Mathematically minimizes total interest paid.",
  },
};

export const DEFAULT_PAYOFF_STRATEGY: PayoffStrategy = "snowball";
