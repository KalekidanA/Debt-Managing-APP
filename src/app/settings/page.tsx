"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { NotificationsCard } from "@/components/settings/NotificationsCard";
import { useAppState } from "@/lib/state/AppStateContext";
import type { FinancialProfile } from "@/lib/engine/financialProfile";

export default function SettingsPage() {
  const { isLoaded } = useAppState();

  if (!isLoaded) return null;

  return <SettingsContent />;
}

// Split out so its form fields only ever mount once `isLoaded` is true —
// mounting earlier would capture default (empty) values in useState's
// initializer, which never re-syncs once the real profile loads.
function SettingsContent() {
  const router = useRouter();
  const { state, setProfile, resetAll } = useAppState();
  const [fundSaved, setFundSaved] = useState(String(state.profile.emergencyFundSaved || ""));
  const [fundTarget, setFundTarget] = useState(String(state.profile.emergencyFundTarget || 1000));
  const [saved, setSaved] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const profile: FinancialProfile = {
      emergencyFundSaved: Number(fundSaved) || 0,
      emergencyFundTarget: Number(fundTarget) || 1000,
    };
    setProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    resetAll();
    router.push("/");
  }

  return (
    <AppShell>
      <header className="mb-5 flex items-center gap-3">
        <Link
          href="/"
          aria-label="Back to Home"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-primary-soft"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
      </header>

      <div className="flex flex-col gap-4">
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-foreground">Emergency fund</p>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Emergency fund saved"
                fieldPrefix="$"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={fundSaved}
                onChange={(e) => setFundSaved(e.target.value)}
              />
              <Field
                label="Emergency fund goal"
                fieldPrefix="$"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={fundTarget}
                onChange={(e) => setFundTarget(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              {saved ? "Saved" : "Save changes"}
            </Button>
          </form>
        </Card>

        <NotificationsCard />

        <Card>
          <p className="text-sm font-semibold text-foreground">Income & expenses</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Logged on the Wallet tab as you earn and spend, not set here — Zero averages them monthly so they stay
            accurate even if they change often.
          </p>
          <Link href="/wallet" className="mt-2 inline-block text-sm font-medium text-primary">
            Go to Wallet →
          </Link>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-foreground">About</p>
          <p className="mt-1 text-sm text-muted-foreground">
            All of your data — income, debts, and progress — is stored only on this device. Nothing is sent to a
            server.
          </p>
          <Link href="/privacy" className="mt-2 inline-block text-sm font-medium text-primary">
            Privacy Policy →
          </Link>
        </Card>

        <Card className="border-critical/30">
          <p className="text-sm font-semibold text-foreground">Reset everything</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently erases your profile, debts, and achievement history from this device. This can&apos;t be
            undone.
          </p>
          {confirmingReset ? (
            <div className="mt-3 flex gap-2">
              <Button variant="danger" className="flex-1" onClick={handleReset}>
                Yes, erase everything
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmingReset(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="danger" className="mt-3 w-full" onClick={() => setConfirmingReset(true)}>
              Reset all data
            </Button>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
