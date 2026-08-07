import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function EmptyDebtsPrompt() {
  return (
    <Card className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="18" height="13" rx="2.2" />
          <path d="M3 10.5h18" />
          <path d="M12 14v3M10.5 15.5h3" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">Add your first debt</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Credit cards, auto loans, student loans — Zero will build your snowball plan the moment you add one.
        </p>
      </div>
      <Link href="/debts" className={buttonClasses("primary", "mt-1")}>
        Add a debt
      </Link>
    </Card>
  );
}
