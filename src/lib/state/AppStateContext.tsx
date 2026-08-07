"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AIChatMessage } from "@/lib/engine/aiAdvisor";
import { detectNewlyPaidOffDebts, detectNewMilestones, type CelebrationEvent } from "@/lib/engine/celebrations";
import type { Debt } from "@/lib/engine/debt";
import { DEFAULT_FINANCIAL_PROFILE, type FinancialProfile } from "@/lib/engine/financialProfile";
import { DEFAULT_PAYOFF_STRATEGY, type PayoffStrategy } from "@/lib/engine/payoffStrategy";
import { loadAppState, saveAppState } from "@/lib/storage/db";

export interface AppState {
  profile: FinancialProfile;
  debts: Debt[];
  strategy: PayoffStrategy;
  extraMonthlyPayment: number;
  chatMessages: AIChatMessage[];
  hasCompletedOnboarding: boolean;
  /** The highest total (non-mortgage) debt ever recorded, used as the
   * denominator for "% of debt paid off so far." Auto-expands if a
   * forgotten debt is added later; never shrinks as balances are paid
   * down. */
  debtBaseline: number;
  /** Permanent, append-only history of milestone/payoff celebrations. */
  celebrations: CelebrationEvent[];
}

const DEFAULT_STATE: AppState = {
  profile: DEFAULT_FINANCIAL_PROFILE,
  debts: [],
  strategy: DEFAULT_PAYOFF_STRATEGY,
  extraMonthlyPayment: 0,
  chatMessages: [],
  hasCompletedOnboarding: false,
  debtBaseline: 0,
  celebrations: [],
};

function totalNonMortgageDebt(debts: Debt[]): number {
  return debts.filter((d) => d.type !== "mortgage").reduce((sum, d) => sum + d.balance, 0);
}

/** Applies a debts mutation to `prev` and detects any milestone/payoff
 * celebrations it crossed, comparing against `prev.debtBaseline` (not the
 * post-mutation baseline) so that adding a brand-new, larger debt in the
 * same action can never itself look like negative progress. */
function applyDebtsChange(prev: AppState, newDebts: Debt[]): AppState {
  const prevTotal = totalNonMortgageDebt(prev.debts);
  const newTotal = totalNonMortgageDebt(newDebts);
  const prevPaidOff = prev.debtBaseline - prevTotal;
  const newPaidOff = prev.debtBaseline - newTotal;

  const newMilestones = detectNewMilestones(prevPaidOff, newPaidOff);
  const newlyPaidOffDebts = detectNewlyPaidOffDebts(prev.debts, newDebts);

  const now = new Date();
  const newCelebrations: CelebrationEvent[] = [
    ...newMilestones.map(
      (amount): CelebrationEvent => ({
        id: crypto.randomUUID(),
        kind: "debtMilestone",
        milestoneAmount: amount,
        createdAt: now,
        seen: false,
      })
    ),
    ...newlyPaidOffDebts.map(
      (debt): CelebrationEvent => ({
        id: crypto.randomUUID(),
        kind: "debtPaidOff",
        debtId: debt.id,
        debtName: debt.name,
        createdAt: now,
        seen: false,
      })
    ),
  ];

  return {
    ...prev,
    debts: newDebts,
    debtBaseline: Math.max(prev.debtBaseline, newTotal),
    celebrations: newCelebrations.length > 0 ? [...prev.celebrations, ...newCelebrations] : prev.celebrations,
  };
}

interface AppStateContextValue {
  state: AppState;
  isLoaded: boolean;
  setProfile: (profile: FinancialProfile) => void;
  addDebt: (debt: Debt) => void;
  updateDebt: (id: string, patch: Partial<Debt>) => void;
  removeDebt: (id: string) => void;
  setStrategy: (strategy: PayoffStrategy) => void;
  setExtraMonthlyPayment: (amount: number) => void;
  addChatMessage: (message: AIChatMessage) => void;
  completeOnboarding: () => void;
  markCelebrationSeen: (id: string) => void;
  resetAll: () => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadAppState<AppState>().then((saved) => {
      if (cancelled) return;
      if (saved) setState({ ...DEFAULT_STATE, ...saved });
      setIsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    saveAppState(state);
  }, [state, isLoaded]);

  const setProfile = useCallback((profile: FinancialProfile) => {
    setState((prev) => ({ ...prev, profile }));
  }, []);

  const addDebt = useCallback((debt: Debt) => {
    setState((prev) => applyDebtsChange(prev, [...prev.debts, debt]));
  }, []);

  const updateDebt = useCallback((id: string, patch: Partial<Debt>) => {
    setState((prev) => applyDebtsChange(prev, prev.debts.map((d) => (d.id === id ? { ...d, ...patch } : d))));
  }, []);

  const removeDebt = useCallback((id: string) => {
    setState((prev) => ({ ...prev, debts: prev.debts.filter((d) => d.id !== id) }));
  }, []);

  const setStrategy = useCallback((strategy: PayoffStrategy) => {
    setState((prev) => ({ ...prev, strategy }));
  }, []);

  const setExtraMonthlyPayment = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, extraMonthlyPayment: amount }));
  }, []);

  const addChatMessage = useCallback((message: AIChatMessage) => {
    setState((prev) => ({ ...prev, chatMessages: [...prev.chatMessages, message] }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, hasCompletedOnboarding: true }));
  }, []);

  const markCelebrationSeen = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      celebrations: prev.celebrations.map((c) => (c.id === id ? { ...c, seen: true } : c)),
    }));
  }, []);

  const resetAll = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      isLoaded,
      setProfile,
      addDebt,
      updateDebt,
      removeDebt,
      setStrategy,
      setExtraMonthlyPayment,
      addChatMessage,
      completeOnboarding,
      markCelebrationSeen,
      resetAll,
    }),
    [
      state,
      isLoaded,
      setProfile,
      addDebt,
      updateDebt,
      removeDebt,
      setStrategy,
      setExtraMonthlyPayment,
      addChatMessage,
      completeOnboarding,
      markCelebrationSeen,
      resetAll,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within an AppStateProvider");
  return ctx;
}
