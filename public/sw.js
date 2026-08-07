// Zero's service worker. There is no push server, so this file only does
// two things: (1) handle taps on a notification that the page itself
// showed via `registration.showNotification()`, and (2) as a best-effort
// enhancement, try to show today's reminder from Periodic Background Sync
// on browsers that support it (installed PWAs on Android/Chrome, subject
// to the browser's own engagement heuristics) — this is the only way to
// get a reminder to appear when the app hasn't been opened, without a
// server telling the device to wake up.
//
// The reminder logic below (goal stage, snowball/avalanche ordering, due
// date math) is intentionally a minimal, plain-JS port of
// src/lib/engine/{goals,debtOrganizer,notificationScheduler}.ts. A service
// worker can't import that TypeScript directly, so if those files change
// in a way that affects reminder text or timing, mirror the change here
// too.

const DB_NAME = "keyval-store";
const STORE_NAME = "keyval";
const STATE_KEY = "zero:v1:app-state";
const MAX_SHOWN_REMINDER_IDS = 300;
const CRITICAL_THRESHOLDS = [5, 3, 1];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(self.registration.scope);
      }
    })
  );
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "zero-daily-check") {
    event.waitUntil(checkAndNotify());
  }
});

async function checkAndNotify() {
  const state = await getAppState();
  if (!state || !state.notificationsEnabled) return;
  if (self.Notification && self.Notification.permission !== "granted") return;

  const now = new Date();
  const daily = computeDailyReminder(state.profile, state.debts, state.strategy, now);
  const criticals = computeCriticalReminders(state.debts, now);
  const all = daily ? [daily, ...criticals] : criticals;

  const shown = new Set(state.shownReminderIds || []);
  const toShow = all.filter((r) => !shown.has(r.id));
  if (toShow.length === 0) return;

  for (const reminder of toShow) {
    try {
      await self.registration.showNotification(reminder.title, { body: reminder.body, tag: reminder.id });
    } catch {
      // Permission may have been revoked since notificationsEnabled was set; stop silently.
      return;
    }
  }

  const merged = [...(state.shownReminderIds || []), ...toShow.map((r) => r.id)];
  const capped = merged.length > MAX_SHOWN_REMINDER_IDS ? merged.slice(merged.length - MAX_SHOWN_REMINDER_IDS) : merged;
  await putAppState({ ...state, shownReminderIds: capped });
}

// ---- Minimal reminder logic (mirrors the TypeScript engine) ----

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function dayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMonthDay(date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function nextDueDate(dueDayOfMonth, referenceDate) {
  const today = startOfDay(referenceDate);
  for (let offset = 0; offset <= 1; offset++) {
    const candidateMonth = addMonths(today, offset);
    const day = Math.min(dueDayOfMonth, daysInMonth(candidateMonth));
    const candidate = new Date(candidateMonth.getFullYear(), candidateMonth.getMonth(), day);
    if (candidate.getTime() >= today.getTime()) return candidate;
  }
  return today;
}

function daysUntilNextDueDate(dueDayOfMonth, referenceDate) {
  const today = startOfDay(referenceDate);
  const due = nextDueDate(dueDayOfMonth, referenceDate);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function isEmergencyFundComplete(profile) {
  return profile.emergencyFundSaved >= profile.emergencyFundTarget;
}

function currentGoalStage(profile, debts) {
  if (!isEmergencyFundComplete(profile)) return "starterSafetyNet";
  const snowballDebts = debts.filter((d) => d.type !== "mortgage" && d.balance > 0);
  return snowballDebts.length > 0 ? "debtFree" : "fullSafetyNet";
}

function orderDebts(debts, strategy) {
  const eligible = debts.filter((d) => d.balance > 0 && d.type !== "mortgage");
  return eligible.sort((a, b) => {
    if (strategy === "avalanche") {
      if (a.apr !== b.apr) return b.apr - a.apr;
      if (a.balance !== b.balance) return a.balance - b.balance;
    } else {
      if (a.balance !== b.balance) return a.balance - b.balance;
      if (a.apr !== b.apr) return b.apr - a.apr;
    }
    return a.id.localeCompare(b.id);
  });
}

function computeDailyReminder(profile, debts, strategy, referenceDate) {
  const stage = currentGoalStage(profile, debts);
  const key = dayKey(referenceDate);

  if (stage === "starterSafetyNet") {
    const remaining = Math.max(profile.emergencyFundTarget - profile.emergencyFundSaved, 0);
    return {
      id: `daily-${key}`,
      title: "Current goal",
      body: `$${round2(remaining)} left to reach your $${profile.emergencyFundTarget} starter emergency fund.`,
    };
  }

  if (stage === "debtFree") {
    const target = orderDebts(debts, strategy)[0];
    if (!target) return null;
    const daysLeft = daysUntilNextDueDate(target.dueDayOfMonth, referenceDate);
    return {
      id: `daily-${key}`,
      title: `Focus: ${target.name}`,
      body: `${daysLeft} day${daysLeft === 1 ? "" : "s"} until your ${target.name} payment is due.`,
    };
  }

  return null;
}

function computeCriticalReminders(debts, referenceDate) {
  const reminders = [];
  for (const debt of debts) {
    if (debt.balance <= 0) continue;
    const daysLeft = daysUntilNextDueDate(debt.dueDayOfMonth, referenceDate);
    if (!CRITICAL_THRESHOLDS.includes(daysLeft)) continue;
    const due = nextDueDate(debt.dueDayOfMonth, referenceDate);
    reminders.push({
      id: `critical-${debt.id}-${dayKey(due)}-${daysLeft}`,
      title: daysLeft <= 1 ? `Due tomorrow: ${debt.name}` : `${debt.name} due in ${daysLeft} days`,
      body: `Minimum payment of $${round2(debt.minimumPayment)} is due ${formatMonthDay(due)}.`,
    });
  }
  return reminders;
}

// ---- Raw IndexedDB access (mirrors idb-keyval's "keyval-store" schema) ----

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAppState() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(STATE_KEY);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putAppState(state) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(state, STATE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
