"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { useAppState } from "@/lib/state/AppStateContext";

export function ProfileSetupForm() {
  const { state, setProfile, completeOnboarding } = useAppState();
  const [fundSaved, setFundSaved] = useState(state.profile.emergencyFundSaved ? String(state.profile.emergencyFundSaved) : "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setProfile({
      emergencyFundSaved: Number(fundSaved) || 0,
      emergencyFundTarget: state.profile.emergencyFundTarget || 1000,
    });
    completeOnboarding();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Welcome to Zero</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Let&apos;s get you to zero debt.</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Save a starter emergency fund first, then attack your debts smallest-to-largest with everything
          you&apos;ve got. One number to start — you&apos;ll log income and expenses on the Wallet tab as they
          happen.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field
            label="Cash saved right now"
            hint="Toward your $1,000 starter emergency fund goal."
            fieldPrefix="$"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="0"
            value={fundSaved}
            onChange={(e) => setFundSaved(e.target.value)}
          />
          <Button type="submit" className="mt-2 w-full">
            Continue
          </Button>
        </form>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Everything stays on this device. You&apos;ll add your credit cards and loans next.
      </p>
    </div>
  );
}
