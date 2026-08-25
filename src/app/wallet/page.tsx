"use client";

import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Sheet } from "@/components/ui/Sheet";
import { StatementCard } from "@/components/wallet/StatementCard";
import { TransactionForm } from "@/components/wallet/TransactionForm";
import { TransactionHistory } from "@/components/wallet/TransactionHistory";
import type { WalletTransactionType } from "@/lib/engine/wallet";
import { useAppState } from "@/lib/state/AppStateContext";
import { useFinancials } from "@/lib/state/useFinancials";

export default function WalletPage() {
  const { state, isLoaded, removeWalletTransaction } = useAppState();
  const { financialStatement } = useFinancials();
  const [addingType, setAddingType] = useState<WalletTransactionType | null>(null);

  if (!isLoaded) return null;

  if (!state.hasCompletedOnboarding) {
    return (
      <AppShell>
        <PageHeader title="Wallet" />
        <Card className="py-8 text-center text-sm text-muted-foreground">
          Finish setting up your profile on the Home tab first.
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="Wallet" subtitle="Your cash, your financial statement, and your debt payments — all in one log." />

      <div className="flex flex-col gap-4">
        <StatementCard statement={financialStatement} />

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setAddingType("income")}>
            + Income
          </Button>
          <Button variant="secondary" onClick={() => setAddingType("expense")}>
            + Expense
          </Button>
          <Button variant="secondary" onClick={() => setAddingType("debtPayment")}>
            + Payment
          </Button>
          <Button variant="secondary" onClick={() => setAddingType("adjustment")}>
            + Cash
          </Button>
        </div>

        <TransactionHistory transactions={state.walletTransactions} onDelete={removeWalletTransaction} />
      </div>

      <Sheet open={addingType !== null} onClose={() => setAddingType(null)} title="Add transaction">
        {addingType !== null && <TransactionForm initialType={addingType} onDone={() => setAddingType(null)} />}
      </Sheet>
    </AppShell>
  );
}
