# Zero — Subscription Model

## Principle: don't paywall the thing that gets people out of debt

The core promise — "enter your debts, get a real snowball/avalanche
plan" — stays free, permanently, with no artificial caps (no "3 debts
max on free," no time-limited trial). Two reasons, not just one:

1. **Ethical**: this is a debt-payoff app. Charging the people who most
   need a payoff plan just to *see* the plan is a bad look, and it's
   exactly the kind of pattern that erodes the trust Zero's whole
   positioning depends on (see `marketing-strategy.md`).
2. **Commercial**: a fully-useful free tier is what makes the app
   shareable — the screenshot someone posts in r/debtfree, the
   celebration screen someone shows a friend, only happens if the free
   experience is genuinely complete, not a demo.

What's monetized instead: **going deeper once someone is already
committed to using Zero seriously** — advanced planning, real AI
conversation, cross-device access, and reporting. These are things a
casual or first-time user doesn't miss, but an engaged user (weeks in,
actively paying down debt) starts to want.

## Free tier — everything that defines "does this work for me"

- Unlimited debts, full snowball & avalanche calculators (real
  amortization math, not an estimate)
- Home dashboard: current goal, debt-free date, interest saved, focus
  debt
- Full Debts tab (add/edit/delete, strategy toggle, extra payment)
- Goals tab: roadmap **and** the full celebration/achievement history
  — this is the retention and shareability engine, it stays free
- Advice tab: budget breakdown + the existing rule-based tips
  (unassigned-surplus alerts, late-payment cost, snowball vs. avalanche
  comparison)
- The rule-based AI advisor (today's implementation) — deterministic,
  free-to-run, and already genuinely useful for "what if I paid $50
  more" style questions
- Daily + critical local notifications

## Zero Plus — the paid tier

**Suggested pricing: $4.99/month or $29.99/year** (~50% effective
discount for annual — standard, and it front-loads cash flow). This
audience is by definition financially stressed; pricing aggressively
against people trying to get out of debt undermines the whole pitch.
Optionally: a one-time "Founding Member" price (e.g. $49.99 lifetime)
for the first cohort of users — common indie tactic, rewards early
adopters, and generates upfront cash before subscription revenue ramps.

What's behind it:

1. **Real AI advisor.** Once the mock rule-based advisor is swapped for
   an actual Claude-powered one (see the app's README roadmap), this is
   the natural gate — it's the one feature with a real, ongoing
   per-message cost to run, so it's the cleanest place to put a paywall
   without it feeling arbitrary. Free users keep the existing rule-based
   advisor (still useful); Plus unlocks open-ended conversation, memory
   of prior context, and handling for messier real-life scenarios
   ("I'm having a baby in 6 months — how does that change my plan?")
   that pattern-matching can't cover.
2. **Saved, comparable scenarios.** Instead of one-off "what if"
   answers, let Plus users save named scenarios ("Current Plan" vs. "If
   I get the raise" vs. "If I sell the car") and compare them side by
   side over time.
3. **Reports & export.** Charts (interest paid over time, a real payoff
   timeline visualization) and a PDF/CSV export — useful for couples
   reviewing progress together or personal record-keeping.
4. **Cross-device sync.** Once there's a backend (your planned AWS
   build), Plus is the natural place to put "your plan follows you
   across phone, tablet, and web" — free stays local-only/single-device
   by design, which is also a meaningful, honest reason for the paywall
   to exist rather than a arbitrary limit.
5. **Home screen widgets** (iOS/Android) showing the countdown/focus
   debt without opening the app.
6. **Custom reminder thresholds** beyond the default 5/3/1-day alerts.
7. **Shared/household tracking.** Couples paying off debt together are
   extremely common in this audience (Ramsey calls it going "gazelle
   intent" as a couple) — a shared plan two people can both see and
   update is a strong, specific upsell for exactly this app's audience.

## What this needs technically (not built yet — scoping for later)

- **iOS**: StoreKit 2, configured through App Store Connect
  (subscription group + products). Capacitor doesn't include this out
  of the box — needs a plugin (e.g.
  `@capacitor-community/in-app-purchases` or a small custom native
  bridge).
- **Android**: Google Play Billing Library, same "needs a Capacitor
  plugin or custom bridge" situation.
- **Entitlement validation**: whether someone's subscription is
  actually active shouldn't be trusted to the client alone (trivial to
  fake locally). The pragmatic path *before* the AWS backend exists:
  **RevenueCat** (generous free tier, handles receipt validation and
  cross-platform entitlement state for you, widely used by apps this
  size) — much faster than rolling your own receipt-validation server.
  Once the AWS backend is real, entitlement checks can move there
  alongside sync, and RevenueCat can either stay as the billing layer
  in front of it or be replaced.
- **Store cut**: both Apple and Google take 30% of subscription
  revenue in a subscriber's first year, dropping to 15% after 12
  consecutive months — and Apple's Small Business Program gives 15%
  flat from day one for developers earning under $1M/year (worth
  enrolling in immediately, it's free to opt in). Price and revenue
  projections should account for this.

## Suggested rollout order

1. Ship free-only first (what's already built) — get real usage data
   on which features engaged users actually return to before deciding
   what to gate.
2. Wire up the real Claude-powered AI advisor behind Plus — it's the
   single highest-leverage paid feature and the most natural gate.
3. Add reports/export and saved scenarios.
4. Cross-device sync and shared/household tracking once the backend
   exists.
