"use client";

import { PAYOFF_STRATEGIES, PAYOFF_STRATEGY_META, type PayoffStrategy } from "@/lib/engine/payoffStrategy";
import { useAppState } from "@/lib/state/AppStateContext";

export function StrategyToggle() {
  const { state, setStrategy } = useAppState();

  return (
    <div className="flex rounded-full border border-border bg-surface p-1">
      {PAYOFF_STRATEGIES.map((strategy) => (
        <button
          key={strategy}
          onClick={() => setStrategy(strategy)}
          className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            state.strategy === strategy ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          {PAYOFF_STRATEGY_META[strategy as PayoffStrategy].title}
        </button>
      ))}
    </div>
  );
}
