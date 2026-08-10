# Launch checklist

Everything below marked **[you]** genuinely requires you — your
identity, your payment method, or a device I don't have access to.
Everything else is already done.

## Test it right now, before spending any money

- **Android**: every push to `main` builds a fresh, installable debug
  APK. Grab it from the latest successful run of "Build mobile apps" in
  the repo's Actions tab → the run's Artifacts section → `zero-debug.apk`.
  Transfer it to an Android phone and install it (you'll need to allow
  "install unknown apps" for whatever app you use to open the file —
  Android will prompt you through this). **[you]** — the download and
  install step itself, since it's your phone.
- **iOS**: the CI build proves the app compiles, but there's no signed
  build yet to install on a real iPhone. To run it on your own iPhone
  for free (no paid Apple Developer account needed for this step): open
  `ios/App/App.xcodeproj` in Xcode on a Mac that has Xcode installed,
  sign in with any free Apple ID under Xcode → Settings → Accounts,
  select your iPhone as the run target, and hit Run. **[you]** — this
  needs a Mac with Xcode (not this one — it only has Command Line
  Tools) and your Apple ID.

## Accounts only you can create

1. **Apple Developer Program** — [developer.apple.com/programs](https://developer.apple.com/programs)
   — $99/year, requires your identity and a credit card. Needed for
   TestFlight and App Store submission (not for the free on-device
   testing above). **[you]**
2. **Google Play Console** — [play.google.com/console](https://play.google.com/console)
   — $25 one-time, requires your identity and a credit card. **[you]**
3. While you're there: enroll in **Apple's Small Business Program**
   (free, cuts Apple's revenue cut from 30% to 15% for the first
   $1M/year) — see `subscription-model.md` for why this matters.
   **[you]**

## Android release signing (do this once you have a Play Console account)

Google's current recommended approach is **Play App Signing** — you
generate an *upload* key (not the final signing key; Google holds
that one for you, which protects you from ever losing it and being
locked out of updating the app):

```bash
keytool -genkeypair -v -keystore upload-keystore.jks \
  -alias zero -keyalg RSA -keysize 2048 -validity 10000
```

Then, so the CI workflow can build signed releases automatically, add
these as **repo secrets** (GitHub repo → Settings → Secrets and
variables → Actions → New repository secret):

| Secret name | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -i upload-keystore.jks \| pbcopy` (paste the result) |
| `ANDROID_KEYSTORE_PASSWORD` | the password you set above |
| `ANDROID_KEY_ALIAS` | `zero` (or whatever alias you chose) |
| `ANDROID_KEY_PASSWORD` | the key password you set above |

Once those four secrets exist, every push to `main` will also produce a
signed `zero-release.aab` artifact — ready to upload to Play Console
as-is, no local build needed. **[you]** for creating the keystore and
pasting the secrets in; everything after that is automatic.

## iOS release signing

More involved than Android's, and genuinely worth doing only once you
have the paid Apple Developer account — it needs a distribution
certificate and provisioning profile from the Apple Developer portal,
either exported as GitHub secrets (for CI signing, using something like
Fastlane `match`) or done locally in Xcode with automatic signing. This
is real, scoped follow-up work — flagging it now so it's not a
surprise, not attempting to build it blind without your Apple account
in the loop.

## Filling out the store listings

- Copy from `store-listing.md` — titles, descriptions, keywords, and
  the naming note about "Zero" possibly colliding with an existing app.
- Privacy Policy URL: `https://kalekidana.github.io/Debt-Managing-APP/privacy`
  (already live).
- Apple's **App Privacy** questionnaire (App Store Connect → your app →
  App Privacy): answer **"Data Not Collected"** across the board — it's
  the literal truth given the architecture, and it's a genuine selling
  point (Apple displays this as a badge on your store page).
- Both stores' content-rating questionnaires: Zero has no
  violence/gambling/mature content, so this should resolve to the
  lowest/all-ages rating on both — just answer honestly.
- Screenshots: see the list in `store-listing.md`. Easiest source is
  the Simulator once you have Xcode running the iOS build, or an
  Android emulator/your own phone for Android.

## Submitting

1. Upload the signed build (Xcode Organizer for iOS once you have
   signing set up; Play Console's release flow for the `.aab`).
2. Fill in the listing content from `store-listing.md`.
3. Submit for review. **[you]** — this is the literal "Submit" button;
   I can't click it for you.
4. Expect: Apple review typically 1–3 days (occasionally up to a
   week); Google Play review can be a few hours to a few days, though
   new developer accounts — especially in the Finance category —
   sometimes see extra scrutiny or an identity-verification step.
   Neither is something to route around; both exist specifically to
   vet finance apps, which is a reasonable thing for them to do.

## After that

- Marketing/launch sequencing: `marketing-strategy.md`.
- What to monetize and how: `subscription-model.md`.
- Real push notifications and the real AI advisor are the two biggest
  remaining engineering items — see the main `README.md` roadmap
  section.
