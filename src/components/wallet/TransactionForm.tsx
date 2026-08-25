"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import type { WalletTransactionType } from "@/lib/engine/wallet";
import { useAppState } from "@/lib/state/AppStateContext";

const TYPE_LABELS: Record<WalletTransactionType, string> = {
  income: "Income",
  expense: "Expense",
  debtPayment: "Debt payment",
};

function todayInputValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

interface TransactionFormProps {
  initialType: WalletTransactionType;
  /** Pre-selects a debt for the "Debt payment" type, e.g. when opened via
   * a specific debt's "Log payment" action. Falls back to the first
   * active debt when omitted. */
  initialDebtId?: string;
  onDone: () => void;
}

export function TransactionForm({ initialType, initialDebtId, onDone }: TransactionFormProps) {
  const { state, addWalletTransaction, logDebtPayment } = useAppState();
  const activeDebts = state.debts.filter((d) => d.balance > 0 && d.type !== "mortgage");

  const [type, setType] = useState<WalletTransactionType>(initialType);
  const [amount, setAmount] = useState("");
  const [dateValue, setDateValue] = useState(todayInputValue());
  const [note, setNote] = useState("");
  const [debtId, setDebtId] = useState(initialDebtId ?? activeDebts[0]?.id ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return;
    const date = new Date(`${dateValue}T12:00:00`);

    if (type === "debtPayment") {
      if (!debtId) return;
      logDebtPayment(debtId, numericAmount, date, note || undefined);
    } else {
      addWalletTransaction({
        id: crypto.randomUUID(),
        type,
        amount: numericAmount,
        date,
        note: note || undefined,
      });
    }
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex rounded-full border border-border bg-surface p-1">
        {(Object.keys(TYPE_LABELS) as WalletTransactionType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition-colors ${
              type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {type === "debtPayment" ? (
        activeDebts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add a debt on the Debts tab first.</p>
        ) : (
          <Select
            label="Debt"
            value={debtId}
            onChange={setDebtId}
            options={activeDebts.map((d) => ({ value: d.id, label: d.name }))}
          />
        )
      ) : null}

      <Field
        label="Amount"
        fieldPrefix="$"
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        autoFocus
      />

      <Field label="Date" type="date" value={dateValue} onChange={(e) => setDateValue(e.target.value)} required />

      {type !== "debtPayment" && (
        <Field label="Note" hint="Optional" placeholder="e.g. Invoice #204" value={note} onChange={(e) => setNote(e.target.value)} />
      )}

      <Button type="submit" className="mt-1 w-full" disabled={type === "debtPayment" && activeDebts.length === 0}>
        Add {TYPE_LABELS[type].toLowerCase()}
      </Button>
    </form>
  );
}
