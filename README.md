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
  fund after onboarding, enable local notifications, or reset all local data.
- **Celebrations** — a full-screen celebration fires every $500 of
  cumulative debt paid off, and again whenever an individual account hits
  $0 (named by account), each logged permanently on the Goals tab.
- **Notifications** — a daily focus-debt update plus 5/3/1-day countdown
  alerts, computed and shown client-side (no server) whenever the app is
  open or regains focus; see `src/lib/notifications/scheduler-client.ts`
  and `public/sw.js`.

All data is stored locally in the browser (IndexedDB) — there's no backend,
no accounts, and nothing leaves your device. See `/privacy` in the app (or
`src/app/privacy/page.tsx`) for the full policy.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript, statically exported
- Tailwind CSS v4
- IndexedDB via [idb-keyval](https://github.com/jakearchibald/idb-keyval) for local-only persistence
- [Vitest](https://vitest.dev) for unit tests
- [Capacitor](https://capacitorjs.com) wraps the same build as native iOS/Android apps (see "Mobile apps" below)

## Mobile apps (iOS / Android)

The `ios/` and `android/` directories are Capacitor-generated native
projects that bundle the static export and run it fully offline — same
UI, same engine, same tests, no rewrite. To rebuild them after a web
change:

```bash
npm run build       # static export to out/
npx cap sync        # copies out/ into both native projects
```

- **Android**: CI (`.github/workflows/build-mobile.yml`) builds an
  installable debug APK on every push — grab it from the workflow run's
  artifacts. Opening `android/` in Android Studio also works locally if
  you have it installed.
- **iOS**: open `ios/App/App.xcodeproj` in Xcode to run on the Simulator
  or your own device (free Apple ID needed, no paid account required for
  device testing). CI proves it compiles on every push.

Everything needed to actually publish to the App Store / Play Store —
store listing copy, a privacy policy, signing setup, and an ordered
checklist of what only you can do (accounts, payment, hitting submit) —
is in [`docs/launch/`](docs/launch/):

- [`launch-checklist.md`](docs/launch/launch-checklist.md) — start here
- [`store-listing.md`](docs/launch/store-listing.md)
- [`marketing-strategy.md`](docs/launch/marketing-strategy.md)
- [`subscription-model.md`](docs/launch/subscription-model.md)

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
  app/                  Route pages: Home, Debts, Goals, Advice, AI (tabs),
                         Settings, and Privacy (reached via Home/Settings)
  components/           UI components, grouped by feature + a shared ui/ kit
  lib/engine/            Pure TypeScript domain logic (debts, payoff math,
                         goal stages, advice, celebrations/milestones,
                         notification scheduling, the mock AI advisor) — no
                         React or browser APIs, fully unit tested
  lib/state/             React context + hooks wiring the engine to the UI
  lib/storage/           IndexedDB persistence
  lib/notifications/     Client-side notification scheduling
public/sw.js             Service worker (notification display + best-effort
                         periodic background sync)
ios/, android/           Capacitor-generated native app projects
assets/                  Source SVG/PNG for the app icon and splash screen
docs/launch/             Store listing copy, marketing strategy, subscription
                         model, and the launch checklist
```

## Roadmap / not yet wired up

- **Real AI**: the AI tab currently uses a rule-based mock
  (`src/lib/engine/aiAdvisor.ts`) that already computes real numbers from
  your data. It's designed to be swapped for the real Claude API without
  touching the UI — a real implementation just needs to match the same
  `AIAdvisorRespond` function signature. (Planned as a paid-tier feature —
  see `docs/launch/subscription-model.md`.)
- **True push notifications** (delivered even when the app is fully
  closed) need a server to trigger them — today's implementation is
  local-only/best-effort (see the Notifications feature above). This is
  a natural fit for whenever a backend gets built.
- **In-app purchases / subscriptions**: the model is designed
  (`docs/launch/subscription-model.md`) but not implemented — needs
  StoreKit 2 / Google Play Billing plus entitlement validation.
- **Plaid**: bank-account linking for automatic balance/expense tracking is
  intentionally not implemented — see the marketing positioning in
  `docs/launch/marketing-strategy.md` for why that's a deliberate choice,
  not a gap.
