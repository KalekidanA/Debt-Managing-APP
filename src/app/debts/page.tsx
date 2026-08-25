"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StrategyToggle } from "@/components/StrategyToggle";
import { BillsSection } from "@/components/bills/BillsSection";
import { CelebrationHistory } from "@/components/celebrations/CelebrationHistory";
import { DebtForm } from "@/components/debts/DebtForm";
import { DebtRow } from "@/components/debts/DebtRow";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import type { Debt } from "@/lib/engine/debt";
import { formatUSD } from "@/lib/engine/utils";
import { totalPaidTowardDebt } from "@/lib/engine/wallet";
import { TransactionForm } from "@/components/wallet/TransactionForm";
import { useAppState } from "@/lib/state/AppStateContext";
import { useFinancials } from "@/lib/state/useFinancials";

export default function DebtsPage() {
  const { state, isLoaded, setExtraMonthlyPayment } = useAppState();
  const { orderedDebts, referenceDate, totalDebt } = useFinancials();
  const [editing, setEditing] = useState<Debt | "new" | null>(null);
  const [loggingPaymentFor, setLoggingPaymentFor] = useState<string | null>(null);

  if (!isLoaded) return null;

  const mortgageDebts = state.debts.filter((d) => d.type === "mortgage");
  const paidOffDebts = state.debts.filter((d) => d.type !== "mortgage" && d.balance <= 0);

  function paidTotalFor(debtId: string) {
    return totalPaidTowardDebt(state.walletTransactions, debtId);
  }

  return (
    <AppShell>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Your Debts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {state.debts.length === 0 ? "Nothing added yet" : `${formatUSD(totalDebt)} total, ${orderedDebts.length} active`}
          </p>
        </div>
        <Button onClick={() => setEditing("new")} className="shrink-0">
          + Add
        </Button>
      </header>

      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Payoff strategy</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Zero defaults to the snowball method for quick, motivating wins.
            </p>
          </div>
          <StrategyToggle />
        </Card>

        <Card>
          <Field
            label="Extra monthly payment"
            hint="Above the minimums, thrown at your focus debt every month."
            fieldPrefix="$"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={state.extraMonthlyPayment ? String(state.extraMonthlyPayment) : ""}
            onChange={(e) => setExtraMonthlyPayment(Number(e.target.value) || 0)}
          />
        </Card>

        {orderedDebts.length === 0 && mortgageDebts.length === 0 && paidOffDebts.length === 0 && (
          <Card className="py-8 text-center text-sm text-muted-foreground">
            No debts yet. Tap &ldquo;+ Add&rdquo; to enter your first credit card or loan.
          </Card>
        )}

        {orderedDebts.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Active — {orderedDebts.length}
            </p>
            {orderedDebts.map((debt, i) => (
              <DebtRow
                key={debt.id}
                debt={debt}
                isFocus={i === 0}
                referenceDate={referenceDate}
                paidTotal={paidTotalFor(debt.id)}
                onClick={() => setEditing(debt)}
                onLogPayment={() => setLoggingPaymentFor(debt.id)}
              />
            ))}
          </section>
        )}

        {mortgageDebts.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Mortgage</p>
            {mortgageDebts.map((debt) => (
              <DebtRow
                key={debt.id}
                debt={debt}
                isFocus={false}
                referenceDate={referenceDate}
                paidTotal={paidTotalFor(debt.id)}
                onClick={() => setEditing(debt)}
                onLogPayment={() => setLoggingPaymentFor(debt.id)}
              />
            ))}
          </section>
        )}

        {paidOffDebts.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Paid off — {paidOffDebts.length}
            </p>
            {paidOffDebts.map((debt) => (
              <DebtRow
                key={debt.id}
                debt={debt}
                isFocus={false}
                referenceDate={referenceDate}
                paidTotal={paidTotalFor(debt.id)}
                onClick={() => setEditing(debt)}
                onLogPayment={() => setLoggingPaymentFor(debt.id)}
              />
            ))}
          </section>
        )}

        <BillsSection />

        <CelebrationHistory events={state.celebrations} />
      </div>

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add a debt" : "Edit debt"}>
        {editing !== null && (
          <DebtForm existing={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />
        )}
      </Sheet>

      <Sheet open={loggingPaymentFor !== null} onClose={() => setLoggingPaymentFor(null)} title="Log a payment">
        {loggingPaymentFor !== null && (
          <TransactionForm
            initialType="debtPayment"
            initialDebtId={loggingPaymentFor}
            onDone={() => setLoggingPaymentFor(null)}
          />
        )}
      </Sheet>
    </AppShell>
  );
}
