"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { BILL_CATEGORY_META, type Bill, type BillCategory } from "@/lib/engine/bills";
import { clampDueDayOfMonth } from "@/lib/engine/debt";
import { useAppState } from "@/lib/state/AppStateContext";

const CATEGORY_OPTIONS = (Object.keys(BILL_CATEGORY_META) as BillCategory[]).map((category) => ({
  value: category,
  label: BILL_CATEGORY_META[category].displayName,
}));

interface BillFormProps {
  existing?: Bill;
  onDone: () => void;
}

export function BillForm({ existing, onDone }: BillFormProps) {
  const { addBill, updateBill, removeBill } = useAppState();

  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState<BillCategory>(existing?.category ?? "subscription");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [dueDay, setDueDay] = useState(existing ? String(existing.dueDayOfMonth) : "1");
  const [accountNickname, setAccountNickname] = useState(existing?.accountNickname ?? "");
  const [accountLast4, setAccountLast4] = useState(existing?.accountLast4 ?? "");
  const [interestRate, setInterestRate] = useState(
    existing?.interestRate ? String((existing.interestRate * 100).toFixed(2)) : ""
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload: Bill = {
      id: existing?.id ?? crypto.randomUUID(),
      name: name.trim() || BILL_CATEGORY_META[category].displayName,
      category,
      amount: Number(amount) || 0,
      dueDayOfMonth: clampDueDayOfMonth(Number(dueDay) || 1),
      accountNickname: accountNickname.trim() || undefined,
      accountLast4: accountLast4.trim() || undefined,
      interestRate: interestRate ? (Number(interestRate) || 0) / 100 : undefined,
      notes: notes.trim() || undefined,
    };
    if (existing) {
      updateBill(existing.id, payload);
    } else {
      addBill(payload);
    }
    onDone();
  }

  function handleDelete() {
    if (existing) removeBill(existing.id);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field
        label="Name"
        placeholder="Netflix"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Select label="Category" value={category} onChange={(v) => setCategory(v as BillCategory)} options={CATEGORY_OPTIONS} />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Amount"
          hint="Per month"
          fieldPrefix="$"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <Field
          label="Due day"
          hint="Day of month"
          type="number"
          inputMode="numeric"
          min={1}
          max={31}
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Account nickname"
          hint="Optional"
          placeholder="Chase Checking"
          value={accountNickname}
          onChange={(e) => setAccountNickname(e.target.value)}
        />
        <Field
          label="Last 4 digits"
          hint="Optional"
          placeholder="4821"
          inputMode="numeric"
          maxLength={4}
          value={accountLast4}
          onChange={(e) => setAccountLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />
      </div>
      <Field
        label="Interest rate"
        hint="Optional — rare for a bill, e.g. a financed purchase paid in installments."
        fieldPrefix="%"
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={interestRate}
        onChange={(e) => setInterestRate(e.target.value)}
      />
      <Field
        label="Notes"
        hint="Optional"
        placeholder="e.g. Family plan, splits with roommate"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="mt-1 flex flex-col gap-2">
        <Button type="submit" className="w-full">
          {existing ? "Save changes" : "Add bill"}
        </Button>
        {existing && (
          <Button type="button" variant="danger" className="w-full" onClick={handleDelete}>
            Delete bill
          </Button>
        )}
      </div>
    </form>
  );
}
