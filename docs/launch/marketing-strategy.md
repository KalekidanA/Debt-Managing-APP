# Zero — Marketing & Growth Strategy

## Positioning: what makes Zero actually different

Most debt/budgeting apps (Monarch, Copilot, Tally, even YNAB) lead with
"link your bank account and we'll show you everything." For someone
already stressed about debt, handing a startup read access to every
transaction is a real trust barrier — and it's the #1 objection in
almost every App Store review of competing debt apps ("didn't want to
link my bank," "too invasive," "why do you need my login").

**Zero's wedge: you never link anything.** You type in your debts once
(a five-minute task), and Zero does the rest — no bank credentials, no
account, no server holding your financial life. That's not a limitation
to apologize for in the marketing copy; it's the headline.

The secondary wedge: **the free tier is a complete debt-payoff planner,**
not a seven-day trial wearing a free label. Competing apps that gate the
payoff calculator itself behind a paywall (EveryDollar, several
Ramsey-adjacent clones) lose people at the exact moment they're trying
to decide if the method even works for them.

**Positioning statement**: *Zero is the debt snowball app for people who
don't want to link their bank account to get out of debt.*

## Who this is for

Primary audience: people carrying $2,000–$30,000 in consumer debt
(credit cards especially) who are actively trying to pay it off — not
casual budgeters. They're often already familiar with "the debt
snowball" as a concept (via Dave Ramsey, TikTok finance content, or
r/personalfinance) and are looking for a tool to execute it, not
learn what it is.

Secondary audience: people just starting Baby Step 1 (building the
$1,000 starter emergency fund) who found Zero via Ramsey-adjacent
content and want something that isn't the official (paid, ecosystem-
locked) EveryDollar app.

## Launch channels, roughly in order of effort-to-payoff

1. **Reddit — r/DaveRamsey, r/debtfree, r/personalfinance.** This is
   the highest-intent, lowest-cost channel available. Post as a genuine
   "I built this because X" story (the actual origin — wanting a
   payoff tracker that didn't need bank access), not an ad. Include a
   screenshot of the payoff ring and celebration screen; those are the
   most visually compelling parts of the app. Respect each
   subreddit's self-promotion rules (some require a minimum account
   age/karma or a specific flair) — check before posting, a removed
   post and a ban is worse than not posting.

2. **Product Hunt launch.** Free, and the personal-finance-tools
   crowd on PH converts reasonably well for utility apps like this.
   Prepare: a 30-second demo video/GIF of adding a debt and watching
   the payoff date update, a tight one-line tagline ("A debt snowball
   planner that never asks for your bank login"), and be ready to
   answer comments live on launch day — that engagement is most of
   what drives PH ranking.

3. **TikTok / Instagram Reels.** The celebration screen (confetti +
   "$500 paid off") and the payoff-progress ring are inherently
   short-video-shaped — a 10-second screen recording of paying off a
   card and the celebration firing is more compelling than any written
   copy. This doesn't require becoming a creator yourself: it's
   reasonable to reach out to 5–10 small (10k–100k follower)
   personal-finance TikTok creators already making "my debt-free
   journey" content and offer them free lifetime Pro access in
   exchange for an honest mention — cheaper and higher-trust than paid
   ads at this stage.

4. **App Store / Play Store optimization (ASO).** Covered concretely
   in `store-listing.md` — the keyword field, screenshots, and title
   all matter more than most people expect for organic install volume.
   Revisit keywords after 2–3 weeks live using each store's search-
   term performance data (App Store Connect and Play Console both
   expose this) and iterate.

5. **A simple SEO landing page.** "Debt snowball calculator" and
   "debt payoff calculator" are real, high-intent, non-trivial-volume
   searches. The GitHub Pages web app already answers that query
   functionally — worth adding a short, keyword-natural paragraph to
   the web app's home page (or a dedicated `/calculator` landing
   page) that a search engine can actually rank, since the web app is
   already free and public. This is slow (months, not weeks) but
   compounds and costs nothing ongoing.

6. **Dave Ramsey-adjacent Facebook groups.** Large, active, and often
   allow tool recommendations in comments (not usually as top-level
   posts — check each group's rules). Lower priority than Reddit/PH
   but worth a pass once the app is live.

## What to explicitly avoid

- **Paid ads before organic signal exists.** Spending on Meta/Google
  ads before you know your free→paid conversion rate is spending blind
  — you won't know if $X of ad spend is worth it. Get 100–200 organic
  installs first, look at actual retention/conversion, then decide if
  paid acquisition even makes sense.
- **Growth-hacking mechanics that undercut trust** (fake urgency,
  "X people just signed up" social proof, dark-pattern subscription
  flows). The entire pitch is "we're the trustworthy option" — one
  manipulative pattern in the funnel undoes that positioning.

## Launch sequence (suggested order)

1. Finish the App Store/Play Store submissions (see the launch
   checklist).
2. Soft-launch: share with a small group (personal network, maybe one
   Reddit comment on an existing thread) to catch obvious bugs before
   a bigger push.
3. Product Hunt launch day.
4. Reddit posts (space out across the target subreddits over 1–2
   weeks, don't post the same content everywhere same-day).
5. Creator outreach (ongoing, not a single event).
6. Revisit ASO keywords after the first few weeks of real search data.
