"use client";

import { useState, type ReactNode } from "react";
import { LockScreen } from "@/components/lock/LockScreen";
import { useAppState } from "@/lib/state/AppStateContext";

/** Gates the whole app behind a PIN whenever app-lock is on. Unlocking is
 * session-only (kept in memory, never persisted), so the app re-locks
 * every time it's freshly loaded or relaunched. */
export function LockGate({ children }: { children: ReactNode }) {
  const { state, isLoaded } = useAppState();
  const [unlocked, setUnlocked] = useState(false);

  if (!isLoaded) return null;
  if (!state.appLock.enabled || unlocked) return <>{children}</>;

  return <LockScreen onUnlock={() => setUnlocked(true)} />;
}
