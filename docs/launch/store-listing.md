# Store listing copy

Ready to paste into App Store Connect and Google Play Console once those
accounts exist. Character counts are noted so nothing gets rejected for
length.

## A naming note, before you paste anything

**"Zero" alone is very likely already taken or confusingly similar to an
existing app** — most notably *Zero — Simple Fasting Tracker*, a
well-known app with millions of installs. Apple and Google both reject
(or at minimum bury in search) apps whose names collide with an existing
popular app in a different category. Two options:

1. **Keep "Zero" as the in-app brand, ship the store listing as "Zero:
   Debt Payoff Planner"** (or similar) — the app still displays as "Zero"
   once installed (that's controlled by the app's display name /
   `CFBundleDisplayName`, separate from the store title), but the store
   *title* is disambiguated and — bonus — the extra words are real
   keywords that help people searching "debt payoff" actually find you.
   This is what the copy below assumes.
2. **Rename the app entirely** if you want a name you can trademark and
   own outright without any collision risk. Worth a domain/App
   Store/Play Store/USPTO trademark search either way before you launch,
   whichever you pick.

---

## App Store (iOS)

| Field | Value | Limit |
|---|---|---|
| App name | `Zero: Debt Payoff Planner` | 30 chars (26 used) |
| Subtitle | `Snowball your debt to $0` | 30 chars (25 used) |
| Primary category | Finance | — |
| Secondary category | Productivity | — |
| Age rating | 4+ | — |
| Promotional text (editable anytime, no review) | `New: milestone celebrations every $500 you pay off, plus an AI advisor for "what if" questions.` | 170 chars |

**Keywords** (comma-separated, not shown publicly, 100 char limit):
```
debt payoff,debt snowball,debt free,budget,credit card payoff,debt tracker,emergency fund,pay off debt
```

**Description** (4000 char limit):

```
Zero is a debt payoff coach for one job: getting you to $0 as fast as
you can, without linking your bank account or handing your financial
life to an app.

HOW IT WORKS
Enter your debts once — credit cards, auto loans, student loans,
whatever you're carrying. Zero builds a debt snowball plan
automatically: pay minimums on everything, throw every extra dollar at
your smallest balance, and knock them out one at a time. Prefer the
math-optimal route instead? Switch to the avalanche method (highest
interest first) with one tap.

SEE YOUR ACTUAL PROGRESS
Your Home screen shows exactly where you stand: your current goal,
your projected debt-free date, how much interest you're saving by
paying extra, and what's due next. No vague encouragement — real
numbers, calculated from your real debts.

STAY MOTIVATED, NOT JUST INFORMED
Every $500 you pay off triggers a real celebration. Every account you
bring to $0 gets its own moment — with its name, because you earned
that. Your achievement history keeps every milestone, permanently, so
you can see how far you've actually come on a bad day.

ASK BEFORE YOU DECIDE
The built-in advisor answers real "what if" questions instantly:
"What if I paid $100 extra a month?" "What happens if I miss a
payment?" "Should I switch to avalanche?" — using your actual numbers,
not generic advice.

PRIVATE BY DESIGN
Zero doesn't ask you to link a bank account. There's no account to
create, no server holding your financial details. Everything you enter
stays on your device. That's not a feature we bolted on — it's the
whole architecture.

WHAT'S FREE
The full debt snowball/avalanche planner, unlimited debts, the
achievement system, and daily/countdown reminders are free, forever —
no trial, no nag screens.

Zero is built for anyone who's tired of debt apps that want your bank
login before they'll even show you a payoff date.
```

---

## Google Play

| Field | Value | Limit |
|---|---|---|
| App name | `Zero: Debt Payoff Planner` | 30 chars |
| Short description | `Pay off debt fast with the snowball method. No bank linking required.` | 80 chars (72 used) |
| Category | Finance | — |
| Content rating | Everyone | — |

**Full description** (4000 char limit): same copy as the App Store
description above — Play Store doesn't have a separate subtitle field,
so the short description carries that job instead.

---

## Screenshots needed

Both stores require screenshots per device size class. Minimum viable
set (can be captured directly from the deployed web app at the right
viewport sizes, or from the Simulator/an Android emulator once you're
running the native build):

1. Home tab — debt-free countdown ring + focus debt card
2. Debts tab — the snowball-ordered list with the "Paying next" badge
3. A celebration moment (milestone or account-paid-off overlay)
4. Advice tab — the budget breakdown + a tip card
5. AI tab — a "what if" conversation

iOS needs these per required device size (6.7", 6.5", 5.5" — check
current App Store Connect requirements, they change); Android needs at
least 2 phone screenshots, 320px–3840px on the long edge.

## URLs to have ready

- **Privacy Policy**: `https://kalekidana.github.io/Debt-Managing-APP/privacy`
- **Support URL**: the GitHub repo's Issues page, or an email address you're prepared to monitor
- **Marketing URL** (optional, iOS): the GitHub Pages URL itself works as a placeholder
