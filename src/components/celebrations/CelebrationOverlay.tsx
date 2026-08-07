"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { formatUSD } from "@/lib/engine/utils";
import { useAppState } from "@/lib/state/AppStateContext";

const CONFETTI_COLORS = ["var(--primary)", "var(--warning)", "var(--critical)", "var(--primary-hover)"];

function ConfettiBurst() {
  // A lazy useState initializer (not useMemo) is the correct place for a
  // one-time impure random draw: it's guaranteed to run exactly once for
  // this component instance. Each new celebration remounts this component
  // via a `key` change, generating a fresh burst.
  const [pieces] = useState(() =>
    Array.from({ length: 26 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 1.6 + Math.random() * 0.9,
      size: 6 + Math.random() * 6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.random() * 360,
      drift: (Math.random() - 0.5) * 60,
    }))
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 rounded-sm opacity-0"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            // @ts-expect-error -- custom property consumed by the keyframes below
            "--drift": `${p.drift}px`,
            "--rotate": `${p.rotate}deg`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translate(0, -10px) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--drift), 260px) rotate(var(--rotate)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export function CelebrationOverlay() {
  const { state, markCelebrationSeen } = useAppState();
  const current = state.celebrations.find((c) => !c.seen);

  if (!current) return null;

  const isMilestone = current.kind === "debtMilestone";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-6 backdrop-blur-sm">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-surface-elevated p-7 text-center shadow-2xl">
        <ConfettiBurst key={current.id} />
        <div className="relative flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
            {isMilestone ? (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 21h8M12 17v4M7 4h10l-1 8a4 4 0 0 1-8 0L7 4Z" />
                <path d="M5 4h2l.5 4H5a2 2 0 0 1 0-4ZM19 4h-2l-.5 4H19a2 2 0 0 0 0-4Z" />
              </svg>
            ) : (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </div>

          {isMilestone ? (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary">Milestone</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {formatUSD(current.milestoneAmount ?? 0)} paid off
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                That&apos;s {formatUSD(current.milestoneAmount ?? 0)} in debt that no longer owns a piece of your
                paycheck. Keep the momentum going.
              </p>
            </>
          ) : (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary">Account paid off</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {current.debtName} is debt zero
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Nothing owed on {current.debtName} anymore — one account down, and its minimum payment now rolls
                into your next one.
              </p>
            </>
          )}

          <button onClick={() => markCelebrationSeen(current.id)} className={buttonClasses("primary", "mt-6 w-full")}>
            Keep going
          </button>
        </div>
      </div>
    </div>
  );
}
