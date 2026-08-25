"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { detectNewlyPaidOffDebts, detectNewMilestones, type CelebrationEvent } from "@/lib/engine/celebrations";
import type { Debt } from "@/lib/engine/debt";
import { DEFAULT_FINANCIAL_PROFILE, type FinancialProfile } from "@/lib/engine/financialProfile";
import { DEFAULT_PAYOFF_STRATEGY, type PayoffStrategy } from "@/lib/engine/payoffStrategy";
import type { WalletTransaction } from "@/lib/engine/wallet";
import { loadAppState, saveAppState } from "@/lib/storage/db";

export interface AppState {
  profile: FinancialProfile;
  debts: Debt[];
  strategy: PayoffStrategy;
  extraMonthlyPayment: number;
  hasCompletedOnboarding: boolean;
  /** The highest total (non-mortgage) debt ever recorded, used as the
   * denominator for "% of debt paid off so far." Auto-expands if a
   * forgotten debt is added later; never shrinks as balances are paid
   * down. */
  debtBaseline: number;
  /** Permanent, append-only history of milestone/payoff celebrations. */
  celebrations: CelebrationEvent[];
  /** Whether the user has opted into local notifications (Notification
   * permission may still need to be granted separately by the browser). */
  notificationsEnabled: boolean;
  /** IDs of ReminderPlans already shown, so the same daily/critical alert
   * doesn't repeat every time the app is reopened. Capped so it can't grow
   * unbounded over months of use. */
  shownReminderIds: string[];
  /** The wallet's full transaction ledger — income, expenses, and debt
   * payments. This is the only source of truth for cash on hand and for
   * the average-monthly-income/expenses figures on the Wallet tab. */
  walletTransactions: WalletTransaction[];
}

const DEFAULT_STATE: AppState = {
  profile: DEFAULT_FINANCIAL_PROFILE,
  debts: [],
  strategy: DEFAULT_PAYOFF_STRATEGY,
  extraMonthlyPayment: 0,
  hasCompletedOnboarding: false,
  debtBaseline: 0,
  celebrations: [],
  notificationsEnabled: false,
  shownReminderIds: [],
  walletTransactions: [],
};

const MAX_SHOWN_REMINDER_IDS = 300;

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
  completeOnboarding: () => void;
  markCelebrationSeen: (id: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  markRemindersShown: (ids: string[]) => void;
  addWalletTransaction: (transaction: WalletTransaction) => void;
  removeWalletTransaction: (id: string) => void;
  /** Logs a real payment toward a debt: reduces that debt's balance (and
   * runs the same celebration detection as editing it directly) and
   * records the cash leaving the wallet, in one atomic update. */
  logDebtPayment: (debtId: string, amount: number, date: Date, note?: string) => void;
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

  const completeOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, hasCompletedOnboarding: true }));
  }, []);

  const markCelebrationSeen = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      celebrations: prev.celebrations.map((c) => (c.id === id ? { ...c, seen: true } : c)),
    }));
  }, []);

  const setNotificationsEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, notificationsEnabled: enabled }));
  }, []);

  const markRemindersShown = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setState((prev) => {
      const merged = [...prev.shownReminderIds, ...ids.filter((id) => !prev.shownReminderIds.includes(id))];
      const trimmed = merged.length > MAX_SHOWN_REMINDER_IDS ? merged.slice(merged.length - MAX_SHOWN_REMINDER_IDS) : merged;
      return { ...prev, shownReminderIds: trimmed };
    });
  }, []);

  const addWalletTransaction = useCallback((transaction: WalletTransaction) => {
    setState((prev) => ({ ...prev, walletTransactions: [...prev.walletTransactions, transaction] }));
  }, []);

  const removeWalletTransaction = useCallback((id: string) => {
    setState((prev) => ({ ...prev, walletTransactions: prev.walletTransactions.filter((t) => t.id !== id) }));
  }, []);

  const logDebtPayment = useCallback((debtId: string, amount: number, date: Date, note?: string) => {
    setState((prev) => {
      const debt = prev.debts.find((d) => d.id === debtId);
      if (!debt || amount <= 0) return prev;
      const newBalance = Math.max(debt.balance - amount, 0);
      const withDebtChange = applyDebtsChange(
        prev,
        prev.debts.map((d) => (d.id === debtId ? { ...d, balance: newBalance } : d))
      );
      const transaction: WalletTransaction = {
        id: crypto.randomUUID(),
        type: "debtPayment",
        amount,
        date,
        note,
        debtId,
        debtName: debt.name,
      };
      return { ...withDebtChange, walletTransactions: [...withDebtChange.walletTransactions, transaction] };
    });
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
      completeOnboarding,
      markCelebrationSeen,
      setNotificationsEnabled,
      markRemindersShown,
      addWalletTransaction,
      removeWalletTransaction,
      logDebtPayment,
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
      completeOnboarding,
      markCelebrationSeen,
      setNotificationsEnabled,
      markRemindersShown,
      addWalletTransaction,
      removeWalletTransaction,
      logDebtPayment,
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
