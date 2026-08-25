"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAppState } from "@/lib/state/AppStateContext";

const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const { verifyAppLockPin, resetAll } = useAppState();
  const [entered, setEntered] = useState("");
  const [wrong, setWrong] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  function handleKey(key: string) {
    if (key === "del") {
      setWrong(false);
      setEntered((prev) => prev.slice(0, -1));
      return;
    }
    if (key === "" || entered.length >= PIN_LENGTH) return;
    const next = entered + key;
    setEntered(next);
    if (next.length === PIN_LENGTH) {
      if (verifyAppLockPin(next)) {
        onUnlock();
      } else {
        setWrong(true);
        setEntered("");
      }
    }
  }

  function handleReset() {
    resetAll();
    onUnlock();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-background px-6">
      {confirmingReset ? (
        <div className="flex w-full max-w-xs flex-col items-center gap-4 text-center">
          <p className="text-base font-semibold text-foreground">Forgot your PIN?</p>
          <p className="text-sm text-muted-foreground">
            There&apos;s no way to recover it — nothing is stored anywhere but this device. The only way back in is
            to erase all of your data and start over.
          </p>
          <Button variant="danger" className="w-full" onClick={handleReset}>
            Erase everything and start over
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setConfirmingReset(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-2">
            <p className="text-xl font-semibold tracking-tight text-foreground">Zero is locked</p>
            <p className="text-sm text-muted-foreground">Enter your PIN to continue</p>
          </div>

          <div className="flex gap-3">
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={`h-3.5 w-3.5 rounded-full border-2 ${
                  wrong
                    ? "border-critical bg-critical"
                    : i < entered.length
                      ? "border-primary bg-primary"
                      : "border-border bg-transparent"
                }`}
              />
            ))}
          </div>

          <p className="-mt-4 h-4 text-sm text-critical">{wrong ? "Wrong PIN, try again" : ""}</p>

          <div className="grid grid-cols-3 gap-4">
            {KEYS.map((key, i) =>
              key === "" ? (
                <div key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleKey(key)}
                  aria-label={key === "del" ? "Delete" : `Digit ${key}`}
                  className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-medium text-foreground hover:bg-primary-soft active:bg-primary-soft"
                >
                  {key === "del" ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" />
                      <path d="M18 9l-6 6M12 9l6 6" />
                    </svg>
                  ) : (
                    key
                  )}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
          >
            Forgot PIN?
          </button>
        </>
      )}
    </div>
  );
}
