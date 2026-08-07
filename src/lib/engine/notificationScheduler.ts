import { format } from "date-fns";
import { currentGoalStage } from "./goals";
import { daysUntilNextDueDate, nextDueDate, type Debt } from "./debt";
import { currentTarget } from "./debtOrganizer";
import { emergencyFundRemaining, type FinancialProfile } from "./financialProfile";
import type { PayoffStrategy } from "./payoffStrategy";
import { round2 } from "./utils";

/** A single reminder Zero wants to surface to the user. This is pure data
 * — the app layer translates it into a real browser Notification / web
 * push payload.
 *
 * By design Zero is deliberately quiet: one daily morning summary, plus
 * critical countdown pings only as a debt's due date closes in. Nothing
 * else gets scheduled — that's the whole point (no spending-tracking
 * pings, no marketing nudges). */
export interface ReminderPlan {
  id: string;
  fireDate: Date;
  title: string;
  body: string;
  isCritical: boolean;
}

/** Days-before-due-date at which a critical reminder fires. */
export const DEFAULT_CRITICAL_THRESHOLDS = [5, 3, 1];

function dayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** The single daily morning notification: a one-line status on the current
 * focus debt (or the emergency fund, if that's still the current goal). */
export function dailyMorningReminder(
  profile: FinancialProfile,
  debts: Debt[],
  strategy: PayoffStrategy,
  referenceDate: Date = new Date()
): ReminderPlan | undefined {
  const stage = currentGoalStage(profile, debts);
  const key = dayKey(referenceDate);

  if (stage === "starterSafetyNet") {
    const remaining = emergencyFundRemaining(profile);
    return {
      id: `daily-${key}`,
      fireDate: referenceDate,
      title: "Current goal",
      body: `$${round2(remaining)} left to reach your $${profile.emergencyFundTarget} starter emergency fund.`,
      isCritical: false,
    };
  }

  if (stage === "debtFree") {
    const target = currentTarget(debts, strategy);
    if (!target) return undefined;
    const daysLeft = daysUntilNextDueDate(target, referenceDate);
    return {
      id: `daily-${key}`,
      fireDate: referenceDate,
      title: `Focus: ${target.name}`,
      body: `${daysLeft} day${daysLeft === 1 ? "" : "s"} until your ${target.name} payment is due.`,
      isCritical: false,
    };
  }

  return undefined;
}

/** Critical, near-due-date reminders — one per debt per threshold day, only
 * generated when `referenceDate` is exactly `threshold` days out from that
 * debt's next due date (so callers running this daily won't double-fire). */
export function criticalReminders(
  debts: Debt[],
  thresholds: number[] = DEFAULT_CRITICAL_THRESHOLDS,
  referenceDate: Date = new Date()
): ReminderPlan[] {
  const reminders: ReminderPlan[] = [];
  for (const debt of debts) {
    if (debt.balance <= 0) continue;
    const daysLeft = daysUntilNextDueDate(debt, referenceDate);
    if (!thresholds.includes(daysLeft)) continue;
    const due = nextDueDate(debt, referenceDate);
    reminders.push({
      id: `critical-${debt.id}-${dayKey(due)}-${daysLeft}`,
      fireDate: referenceDate,
      title: daysLeft <= 1 ? `Due tomorrow: ${debt.name}` : `${debt.name} due in ${daysLeft} days`,
      body: `Minimum payment of $${round2(debt.minimumPayment)} is due ${format(due, "MMM d")}.`,
      isCritical: true,
    });
  }
  return reminders;
}

/** Zero has no server, so reminders are computed and shown client-side
 * whenever the app is opened or regains focus — this filters out any that
 * have already been shown (by id) so the same alert doesn't repeat every
 * time the app is reopened on the same day. */
export function filterUnshownReminders(reminders: ReminderPlan[], shownIds: string[]): ReminderPlan[] {
  const shown = new Set(shownIds);
  return reminders.filter((r) => !shown.has(r.id));
}
