"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface TabDef {
  href: string;
  label: string;
  icon: (active: boolean) => ReactNode;
}

function HomeIcon(active: boolean) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H10v-5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20h3.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function DebtsIcon(active: boolean) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="2.2" />
      <path d="M3 10.5h18" />
      <path d="M7 15h4" />
    </svg>
  );
}

function AdviceIcon(active: boolean) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .8 1.7v.3h5.6v-.3c0-.7.3-1.3.8-1.7A6 6 0 0 0 12 3Z" />
    </svg>
  );
}

function AIIcon(active: boolean) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <path d="M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4Z" />
    </svg>
  );
}

const TABS: TabDef[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/debts", label: "Debts", icon: DebtsIcon },
  { href: "/advice", label: "Advice", icon: AdviceIcon },
  { href: "/ai", label: "AI", icon: AIIcon },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] font-medium"
            >
              <span className={active ? "text-primary" : "text-muted-foreground"}>{tab.icon(active)}</span>
              <span className={active ? "text-primary" : "text-muted-foreground"}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
