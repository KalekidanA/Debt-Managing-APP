"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getPermission,
  isSupported,
  registerServiceWorker,
  requestPermission,
  showTestNotification,
  type NotificationSupport,
} from "@/lib/notifications/scheduler-client";
import { useAppState } from "@/lib/state/AppStateContext";

const STATUS_COPY: Record<NotificationSupport, string> = {
  unsupported: "Not supported in this browser",
  granted: "On",
  denied: "Blocked — enable notifications for this site in your browser settings",
  default: "Off",
};

export function NotificationsCard() {
  const { state, setNotificationsEnabled } = useAppState();
  const [permission, setPermission] = useState<NotificationSupport>("default");
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    // Notification.permission is a browser-only global that's never
    // available during the static export's prerender, so this has to be
    // read post-mount (rather than in a lazy useState initializer) to
    // avoid a hydration mismatch between the prerendered and live DOM.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermission(getPermission());
  }, []);

  const on = state.notificationsEnabled && permission === "granted";

  async function handleEnable() {
    const result = await requestPermission();
    setPermission(result);
    if (result === "granted") setNotificationsEnabled(true);
  }

  function handleDisable() {
    setNotificationsEnabled(false);
  }

  async function handleTest() {
    const registration = await registerServiceWorker();
    if (!registration) return;
    await showTestNotification(registration);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2000);
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Notifications</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            on ? "bg-primary-soft text-primary" : "bg-background text-muted-foreground"
          }`}
        >
          {STATUS_COPY[permission === "granted" && !state.notificationsEnabled ? "default" : permission]}
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        A quiet daily update on your focus debt, plus alerts at 5, 3, and 1 day before it&apos;s due. Zero has no
        server, so these appear when you open the app or bring it to the front — not on a fixed clock. On Android,
        installing Zero to your home screen may let them arrive even when it&apos;s closed; on iPhone, opening the
        app is what catches you up.
      </p>

      {!isSupported() ? null : on ? (
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={handleTest}>
            {testSent ? "Sent" : "Send a test"}
          </Button>
          <Button variant="ghost" className="flex-1" onClick={handleDisable}>
            Turn off
          </Button>
        </div>
      ) : permission === "denied" ? null : (
        <Button variant="primary" className="mt-3 w-full" onClick={handleEnable}>
          Enable notifications
        </Button>
      )}
    </Card>
  );
}
