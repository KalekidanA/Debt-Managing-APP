"use client";

import { useState } from "react";
import { BillForm } from "@/components/bills/BillForm";
import { BillPaymentForm } from "@/components/bills/BillPaymentForm";
import { BillRow } from "@/components/bills/BillRow";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Sheet } from "@/components/ui/Sheet";
import {
  amountPaidForBillInMonth,
  billsByCategory,
  sortByNextDueDate,
  totalMonthlyBillsAmount,
  totalPaidThisMonth,
  BILL_CATEGORY_META,
  type Bill,
} from "@/lib/engine/bills";
import { formatUSD } from "@/lib/engine/utils";
import { useAppState } from "@/lib/state/AppStateContext";
import { useFinancials } from "@/lib/state/useFinancials";

type Grouping = "dueDate" | "category";

export function BillsSection() {
  const { state } = useAppState();
  const { referenceDate } = useFinancials();
  const [grouping, setGrouping] = useState<Grouping>("dueDate");
  const [editing, setEditing] = useState<Bill | "new" | null>(null);
  const [payingFor, setPayingFor] = useState<Bill | null>(null);

  const { bills, walletTransactions } = state;
  const committed = totalMonthlyBillsAmount(bills);
  const paidSoFar = totalPaidThisMonth(bills, walletTransactions, referenceDate);

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Bills & subscriptions</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {bills.length === 0
              ? "Rent, utilities, subscriptions — anything recurring."
              : `${formatUSD(committed)}/mo committed · ${formatUSD(paidSoFar)} paid this month`}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setEditing("new")} className="shrink-0">
          + Add
        </Button>
      </header>

      {bills.length === 0 ? (
        <Card className="py-8 text-center text-sm text-muted-foreground">
          No bills yet. Add rent, utilities, or a subscription so your budget stays accurate even as your income
          changes.
        </Card>
      ) : (
        <>
          <div className="flex rounded-full border border-border bg-surface p-1">
            <button
              type="button"
              onClick={() => setGrouping("dueDate")}
              className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                grouping === "dueDate" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              By due date
            </button>
            <button
              type="button"
              onClick={() => setGrouping("category")}
              className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                grouping === "category" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              By category
            </button>
          </div>

          {grouping === "dueDate" ? (
            <div className="flex flex-col gap-2.5">
              {sortByNextDueDate(bills, referenceDate).map((bill) => (
                <BillRow
                  key={bill.id}
                  bill={bill}
                  referenceDate={referenceDate}
                  paidThisMonth={amountPaidForBillInMonth(bill.id, walletTransactions, referenceDate)}
                  onClick={() => setEditing(bill)}
                  onMarkPaid={() => setPayingFor(bill)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {billsByCategory(bills).map((group) => (
                <div key={group.category} className="flex flex-col gap-2.5">
                  <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {BILL_CATEGORY_META[group.category].displayName} — {group.bills.length}
                  </p>
                  {sortByNextDueDate(group.bills, referenceDate).map((bill) => (
                    <BillRow
                      key={bill.id}
                      bill={bill}
                      referenceDate={referenceDate}
                      paidThisMonth={amountPaidForBillInMonth(bill.id, walletTransactions, referenceDate)}
                      onClick={() => setEditing(bill)}
                      onMarkPaid={() => setPayingFor(bill)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add a bill" : "Edit bill"}>
        {editing !== null && (
          <BillForm existing={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />
        )}
      </Sheet>

      <Sheet open={payingFor !== null} onClose={() => setPayingFor(null)} title="Mark as paid">
        {payingFor !== null && <BillPaymentForm bill={payingFor} onDone={() => setPayingFor(null)} />}
      </Sheet>
    </section>
  );
}
