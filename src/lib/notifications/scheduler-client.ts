import { criticalReminders, dailyMorningReminder, filterUnshownReminders, type ReminderPlan } from "@/lib/engine/notificationScheduler";
import type { AppState } from "@/lib/state/AppStateContext";

export type NotificationSupport = "unsupported" | NotificationPermission;

/** Zero has no push server: this module's job is entirely client-side —
 * register the service worker, ask for permission, and (whenever the app
 * is open or regains focus) compute and show any reminders that haven't
 * been shown yet. The service worker's own best-effort periodic-sync
 * handler covers the "app isn't open" case on browsers that support it. */

export function isSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "Notification" in window;
}

export function getPermission(): NotificationSupport {
  if (!isSupported()) return "unsupported";
  return Notification.permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isSupported()) return null;
  try {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    return await navigator.serviceWorker.register(`${basePath}/sw.js`);
  } catch {
    return null;
  }
}

export async function requestPermission(): Promise<NotificationSupport> {
  if (!isSupported()) return "unsupported";
  return Notification.requestPermission();
}

/** Best-effort: registers Periodic Background Sync so the service worker
 * may show reminders even when the app isn't open. Only Chromium browsers
 * on Android support this today, and only for installed (home-screen)
 * apps that meet the browser's own engagement bar — this silently no-ops
 * everywhere else. */
export async function tryRegisterPeriodicSync(registration: ServiceWorkerRegistration): Promise<boolean> {
  try {
    const reg = registration as ServiceWorkerRegistration & {
      periodicSync?: { register: (tag: string, options: { minInterval: number }) => Promise<void> };
    };
    if (!reg.periodicSync) return false;
    const status = await navigator.permissions.query({
      name: "periodic-background-sync" as PermissionName,
    });
    if (status.state !== "granted") return false;
    await reg.periodicSync.register("zero-daily-check", { minInterval: 12 * 60 * 60 * 1000 });
    return true;
  } catch {
    return false;
  }
}

/** Computes today's daily + critical reminders, filters out ones already
 * shown, displays the new ones via the service worker, and returns their
 * ids so the caller can persist them (via markRemindersShown) to avoid
 * re-showing on the next check. */
export async function checkAndShowReminders(
  state: Pick<AppState, "profile" | "debts" | "strategy" | "shownReminderIds">,
  registration: ServiceWorkerRegistration,
  referenceDate: Date = new Date()
): Promise<string[]> {
  const daily = dailyMorningReminder(state.profile, state.debts, state.strategy, referenceDate);
  const criticals = criticalReminders(state.debts, undefined, referenceDate);
  const all: ReminderPlan[] = daily ? [daily, ...criticals] : criticals;

  const toShow = filterUnshownReminders(all, state.shownReminderIds);
  if (toShow.length === 0) return [];

  for (const reminder of toShow) {
    try {
      await registration.showNotification(reminder.title, { body: reminder.body, tag: reminder.id });
    } catch {
      return [];
    }
  }

  return toShow.map((r) => r.id);
}

/** Shows an immediate, non-persisted test notification so the user can
 * confirm notifications are actually working on their device. */
export async function showTestNotification(registration: ServiceWorkerRegistration): Promise<void> {
  await registration.showNotification("Zero notifications are on", {
    body: "You'll see your daily focus-debt update and countdown alerts here.",
    tag: "zero-test-notification",
  });
}
