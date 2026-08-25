"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { useAppState } from "@/lib/state/AppStateContext";

type Mode = "idle" | "setup" | "change" | "turnoff";

const PIN_LENGTH = 4;
const PIN_PATTERN = new RegExp(`^\\d{${PIN_LENGTH}}$`);

const PIN_FIELD_PROPS = {
  type: "password" as const,
  inputMode: "numeric" as const,
  maxLength: PIN_LENGTH,
  autoComplete: "off",
};

export function AppLockCard() {
  const { state, enableAppLock, disableAppLock, verifyAppLockPin } = useAppState();
  const [mode, setMode] = useState<Mode>("idle");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  function cancel() {
    setMode("idle");
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setError("");
  }

  function handleSetupOrChange(event: FormEvent) {
    event.preventDefault();
    if (mode === "change" && !verifyAppLockPin(currentPin)) {
      setError("That's not the current PIN.");
      return;
    }
    if (!PIN_PATTERN.test(newPin)) {
      setError(`PIN must be ${PIN_LENGTH} digits.`);
      return;
    }
    if (newPin !== confirmPin) {
      setError("PINs don't match.");
      return;
    }
    enableAppLock(newPin);
    cancel();
  }

  function handleTurnOff(event: FormEvent) {
    event.preventDefault();
    if (!verifyAppLockPin(currentPin)) {
      setError("That's not the current PIN.");
      return;
    }
    disableAppLock();
    cancel();
  }

  return (
    <Card>
      <p className="text-sm font-semibold text-foreground">App lock</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {state.appLock.enabled
          ? "A PIN is required to open Zero on this device."
          : "Require a PIN to open Zero — protects your data if someone else picks up this device. Your data still never leaves it."}
      </p>

      {mode === "idle" && (
        <div className="mt-3 flex gap-2">
          {state.appLock.enabled ? (
            <>
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setMode("change")}>
                Change PIN
              </Button>
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setMode("turnoff")}>
                Turn off
              </Button>
            </>
          ) : (
            <Button type="button" variant="secondary" className="w-full" onClick={() => setMode("setup")}>
              Turn on PIN lock
            </Button>
          )}
        </div>
      )}

      {(mode === "setup" || mode === "change") && (
        <form onSubmit={handleSetupOrChange} className="mt-3 flex flex-col gap-3">
          {mode === "change" && (
            <Field
              label="Current PIN"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              {...PIN_FIELD_PROPS}
            />
          )}
          <Field label="New PIN" value={newPin} onChange={(e) => setNewPin(e.target.value)} {...PIN_FIELD_PROPS} />
          <Field
            label="Confirm new PIN"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            {...PIN_FIELD_PROPS}
          />
          {error && <p className="text-xs text-critical">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Save
            </Button>
            <Button type="button" variant="ghost" className="flex-1" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {mode === "turnoff" && (
        <form onSubmit={handleTurnOff} className="mt-3 flex flex-col gap-3">
          <Field
            label="Current PIN"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
            {...PIN_FIELD_PROPS}
          />
          {error && <p className="text-xs text-critical">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="danger" className="flex-1">
              Turn off PIN lock
            </Button>
            <Button type="button" variant="ghost" className="flex-1" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
