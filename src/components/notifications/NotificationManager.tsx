"use client";

import { useEffect, useRef } from "react";
import {
  checkAndShowReminders,
  getPermission,
  registerServiceWorker,
  tryRegisterPeriodicSync,
} from "@/lib/notifications/scheduler-client";
import { useAppState } from "@/lib/state/AppStateContext";

const FOREGROUND_RECHECK_MS = 30 * 60 * 1000;

/** Renders nothing — just keeps the service worker registered and, while
 * the user has notifications enabled and permission granted, checks for
 * (and shows) any due reminders whenever the app is opened, regains
 * focus, or every 30 minutes while left open. */
export function NotificationManager() {
  const { state, isLoaded, markRemindersShown } = useAppState();
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    let cancelled = false;
    registerServiceWorker().then((registration) => {
      if (!cancelled) registrationRef.current = registration;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !state.notificationsEnabled || getPermission() !== "granted") return;

    let cancelled = false;

    async function runCheck() {
      const registration = registrationRef.current ?? (await registerServiceWorker());
      if (!registration || cancelled) return;
      registrationRef.current = registration;
      tryRegisterPeriodicSync(registration);
      const shownIds = await checkAndShowReminders(state, registration);
      if (shownIds.length > 0 && !cancelled) markRemindersShown(shownIds);
    }

    runCheck();

    const onVisibility = () => {
      if (document.visibilityState === "visible") runCheck();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", runCheck);
    const interval = setInterval(runCheck, FOREGROUND_RECHECK_MS);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", runCheck);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, state.notificationsEnabled, state.profile, state.debts, state.strategy, state.shownReminderIds]);

  return null;
}
