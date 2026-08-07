# Zero — Debt Managing App

Zero is a focused debt payoff coach: save a starter emergency fund, then
attack your debts smallest-to-largest (the debt snowball) with everything
you've got.

## Features

- **Home** — your current goal, a payoff-progress ring, debt-free date,
  interest saved vs. paying minimums only, and your current focus debt.
- **Debts** — add/edit credit cards, auto loans, student loans, etc.; toggle
  between the debt snowball (default) and debt avalanche strategies; set an
  extra monthly payment.
- **Goals** — a roadmap of Current Goal → Next Goal → what comes after, plus
  a permanent achievement history.
- **Advice** — a monthly budget breakdown and personalized, numbers-backed
  tips (unassigned surplus, snowball vs. avalanche interest delta, the cost
  of a late payment, what an extra $100/month would do).
- **AI** — a chat tab for "what if" questions ("what if I paid $50 extra a
  month?", "how long until I'm debt-free?"), currently answered by a
  rule-based mock advisor that computes real numbers from your data.
- **Settings** (via the gear icon on Home) — edit income/expenses/emergency
  fund after onboarding, or reset all local data.
- **Celebrations** — a full-screen celebration fires every $500 of
  cumulative debt paid off, and again whenever an individual account hits
  $0 (named by account), each logged permanently on the Goals tab.

All data is stored locally in the browser (IndexedDB) — there's no backend,
no accounts, and nothing leaves your device.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4
- IndexedDB via [idb-keyval](https://github.com/jakearchibald/idb-keyval) for local-only persistence
- [Vitest](https://vitest.dev) for unit tests

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run the test suite (covers the payoff engine: snowball/avalanche ordering,
amortization math, goal-stage transitions, notification thresholds,
milestone/celebration detection):

```bash
npm test
```

## Project structure

```
src/
  app/                  Route pages: Home, Debts, Goals, Advice, AI (tabs)
                         and Settings (reached via the gear icon on Home)
  components/           UI components, grouped by feature + a shared ui/ kit
  lib/engine/            Pure TypeScript domain logic (debts, payoff math,
                         goal stages, advice, celebrations/milestones,
                         notification scheduling, the mock AI advisor) — no
                         React or browser APIs, fully unit tested
  lib/state/             React context + hooks wiring the engine to the UI
  lib/storage/           IndexedDB persistence
```

## Roadmap / not yet wired up

- **Real AI**: the AI tab currently uses a rule-based mock
  (`src/lib/engine/aiAdvisor.ts`) that already computes real numbers from
  your data. It's designed to be swapped for the real Claude API without
  touching the UI — a real implementation just needs to match the same
  `AIAdvisorRespond` function signature.
- **Push notifications**: the reminder logic (one quiet daily summary, plus
  critical countdown alerts as a due date approaches) already exists in
  `src/lib/engine/notificationScheduler.ts`, but isn't yet wired to the
  browser Notifications API / a service worker.
- **Plaid**: bank-account linking for automatic balance/expense tracking is
  not implemented; all data entry is currently manual.
