"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { Bill } from "@/lib/engine/bills";
import { useAppState } from "@/lib/state/AppStateContext";

function todayInputValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

interface BillPaymentFormProps {
  bill: Bill;
  onDone: () => void;
}

export function BillPaymentForm({ bill, onDone }: BillPaymentFormProps) {
  const { logBillPayment } = useAppState();
  const [amount, setAmount] = useState(String(bill.amount || ""));
  const [dateValue, setDateValue] = useState(todayInputValue());
  const [note, setNote] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return;
    const date = new Date(`${dateValue}T12:00:00`);
    logBillPayment(bill.id, numericAmount, date, note || undefined);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field
        label="Amount paid"
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
      <Field label="Note" hint="Optional" placeholder="e.g. Paid a day early" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button type="submit" className="mt-1 w-full">
        Mark {bill.name} as paid
      </Button>
    </form>
  );
}
