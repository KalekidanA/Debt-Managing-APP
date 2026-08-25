"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { clampDueDayOfMonth, DEBT_TYPE_META, type Debt, type DebtType } from "@/lib/engine/debt";
import { useAppState } from "@/lib/state/AppStateContext";

const TYPE_OPTIONS = (Object.keys(DEBT_TYPE_META) as DebtType[]).map((type) => ({
  value: type,
  label: DEBT_TYPE_META[type].displayName,
}));

interface DebtFormProps {
  existing?: Debt;
  onDone: () => void;
}

export function DebtForm({ existing, onDone }: DebtFormProps) {
  const { addDebt, updateDebt, removeDebt } = useAppState();

  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<DebtType>(existing?.type ?? "creditCard");
  const [balance, setBalance] = useState(existing ? String(existing.balance) : "");
  const [apr, setApr] = useState(existing ? String((existing.apr * 100).toFixed(2)) : "");
  const [minimumPayment, setMinimumPayment] = useState(existing ? String(existing.minimumPayment) : "");
  const [dueDay, setDueDay] = useState(existing ? String(existing.dueDayOfMonth) : "1");
  const [creditLimit, setCreditLimit] = useState(existing?.creditLimit ? String(existing.creditLimit) : "");
  const [originalBalance, setOriginalBalance] = useState(existing?.originalBalance ? String(existing.originalBalance) : "");
  const [accountNickname, setAccountNickname] = useState(existing?.accountNickname ?? "");
  const [accountLast4, setAccountLast4] = useState(existing?.accountLast4 ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload: Debt = {
      id: existing?.id ?? crypto.randomUUID(),
      name: name.trim() || DEBT_TYPE_META[type].displayName,
      type,
      balance: Number(balance) || 0,
      apr: (Number(apr) || 0) / 100,
      minimumPayment: Number(minimumPayment) || 0,
      dueDayOfMonth: clampDueDayOfMonth(Number(dueDay) || 1),
      creditLimit: creditLimit ? Number(creditLimit) : undefined,
      originalBalance: originalBalance ? Number(originalBalance) : undefined,
      accountNickname: accountNickname.trim() || undefined,
      accountLast4: accountLast4.trim() || undefined,
    };
    if (existing) {
      updateDebt(existing.id, payload);
    } else {
      addDebt(payload);
    }
    onDone();
  }

  function handleDelete() {
    if (existing) removeDebt(existing.id);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field
        label="Name"
        placeholder="Chase Sapphire"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Select
        label="Type"
        value={type}
        onChange={(v) => setType(v as DebtType)}
        options={TYPE_OPTIONS}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Balance"
          fieldPrefix="$"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          required
        />
        <Field
          label="Interest rate (APR)"
          fieldPrefix="%"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={apr}
          onChange={(e) => setApr(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Minimum payment"
          fieldPrefix="$"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={minimumPayment}
          onChange={(e) => setMinimumPayment(e.target.value)}
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
      {type === "creditCard" && (
        <Field
          label="Credit limit"
          hint="Optional — used to show your utilization."
          fieldPrefix="$"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={creditLimit}
          onChange={(e) => setCreditLimit(e.target.value)}
        />
      )}
      <Field
        label="Original balance"
        hint="Optional — lets Zero show how far you've come on this debt."
        fieldPrefix="$"
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={originalBalance}
        onChange={(e) => setOriginalBalance(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Account nickname"
          hint="Optional — where the payment comes from."
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

      <div className="mt-1 flex flex-col gap-2">
        <Button type="submit" className="w-full">
          {existing ? "Save changes" : "Add debt"}
        </Button>
        {existing && (
          <Button type="button" variant="danger" className="w-full" onClick={handleDelete}>
            Delete debt
          </Button>
        )}
      </div>
    </form>
  );
}
