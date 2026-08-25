"use client";

import { useMemo } from "react";
import { buildSnapshot, type FinancialSnapshot } from "@/lib/engine/financialSnapshot";
import { orderDebts } from "@/lib/engine/debtOrganizer";
import { compareStrategies, interestSavedVersusMinimumOnly, type PayoffPlan } from "@/lib/engine/payoffCalculator";
import { buildFinancialStatement, type FinancialStatement } from "@/lib/engine/wallet";
import { useAppState } from "./AppStateContext";

export interface Financials {
  referenceDate: Date;
  snapshot: FinancialSnapshot;
  orderedDebts: ReturnType<typeof orderDebts>;
  focusDebt: ReturnType<typeof orderDebts>[number] | undefined;
  plans: Partial<Record<"snowball" | "avalanche", PayoffPlan>>;
  currentPlan: PayoffPlan | undefined;
  savingsVsMinimum: { interestSaved: number; monthsSaved: number } | undefined;
  totalDebt: number;
  debtPaidOffProgress: number;
  /** debtBaseline - totalDebt: the dollar amount paid off so far, across
   * every debt, since the highest total was recorded. */
  totalPaidSoFar: number;
  financialStatement: FinancialStatement;
}

/** Central place that turns raw app state into everything the tabs need to
 * render: the current plan, the strategy comparison, the wallet-derived
 * financial statement, and the user's current focus debt. Keeping this in
 * one hook means every tab agrees on the same numbers. */
export function useFinancials(): Financials {
  const { state } = useAppState();

  return useMemo(() => {
    const referenceDate = new Date();
    const financialStatement = buildFinancialStatement(state.walletTransactions, state.debts);
    const snapshot = buildSnapshot(
      state.profile,
      state.debts,
      state.strategy,
      state.extraMonthlyPayment,
      financialStatement.averageMonthlyIncome,
      financialStatement.averageMonthlyExpenses,
      referenceDate
    );
    const orderedDebts = orderDebts(state.debts, state.strategy);
    const plans = compareStrategies(state.debts, state.extraMonthlyPayment, referenceDate);
    const savingsVsMinimum = interestSavedVersusMinimumOnly(
      state.debts,
      state.strategy,
      state.extraMonthlyPayment,
      referenceDate
    );
    const totalDebt = state.debts.filter((d) => d.type !== "mortgage").reduce((sum, d) => sum + d.balance, 0);
    const totalPaidSoFar = Math.max(state.debtBaseline - totalDebt, 0);
    const debtPaidOffProgress = state.debtBaseline > 0 ? Math.max(0, Math.min(1, totalPaidSoFar / state.debtBaseline)) : 0;

    return {
      referenceDate,
      snapshot,
      orderedDebts,
      focusDebt: orderedDebts[0],
      plans,
      currentPlan: snapshot.currentPlan,
      savingsVsMinimum,
      totalDebt,
      debtPaidOffProgress,
      totalPaidSoFar,
      financialStatement,
    };
  }, [state.profile, state.debts, state.strategy, state.extraMonthlyPayment, state.debtBaseline, state.walletTransactions]);
}
