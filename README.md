# Team Baby

A mobile-first sleep / awake / feeding tracker for two people to log
together and see live, from any device. Deployed as a static site on
GitHub Pages; data lives in Firebase (Firestore), not in the browser.

## How it works

- **Repo is public** (required for free GitHub Pages), but contains no
  personal data — only app code and non-secret Firebase project config.
- **Data** lives in Firestore, shared in real time between every device
  that's logged in.
- **Access control** is enforced server-side by Firestore Security Rules
  (`firestore.rules`), not by hiding a URL. Only one Firebase account
  (`timka@team.family`) may read or write, and that account's
  password *is* the site's shared password — Firebase itself checks it on
  every login (and rate-limits guesses), so nothing password-related is
  ever embedded in the shipped JS.

## One-time setup (you only need to do this once)

1. **Create a Firebase project** at https://console.firebase.google.com
   (free "Spark" plan is enough).
2. **Enable Firestore**: Build > Firestore Database > Create database
   (production mode, any region).
3. **Paste the security rules**: Firestore Database > Rules tab, replace
   the contents with `firestore.rules` from this repo, then Publish.
4. **Enable Email/Password sign-in**: Build > Authentication > Sign-in
   method > enable "Email/Password".
5. **Create the shared account**: Authentication > Users > Add user:
   - Email: `timka@team.family`
   - Password: **this becomes the shared password you and your wife type
     into the app.** Pick a long, unique one.
6. **Get the web config**: Project settings (gear icon) > General > "Your
   apps" > add a Web app (</> icon) > copy the `firebaseConfig` values.
7. **Add repository secrets** on GitHub (Settings > Secrets and variables
   > Actions > New repository secret), one per config value:

   | Secret name | Firebase config field |
   | --- | --- |
   | `FIREBASE_API_KEY` | `apiKey` |
   | `FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `FIREBASE_PROJECT_ID` | `projectId` |
   | `FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `FIREBASE_APP_ID` | `appId` |

8. **Enable GitHub Pages**: Settings > Pages > Source > GitHub Actions.
9. Push to `main` (or re-run the workflow) — it builds and deploys
   automatically.

To change the shared password later: Firebase Console > Authentication >
Users > the `timka@team.family` row > reset password. No redeploy
needed.

## Installing on your phone

The site is a PWA, so it installs like a real app — its own icon, no
Safari/Chrome address bar, full-screen. Nothing to download from a store.

- **iOS**: open the site in Safari (must be Safari, not Chrome) → Share
  button → **Add to Home Screen**.
- **Android**: open the site in Chrome → menu (⋮) → **Add to Home
  screen** / **Install app**.

## Using the app

- Tap the baby's name in the header (next to the pencil icon) to rename it.
  "Team" stays fixed; the name is shared and synced live to both of you.
- **Log** tab: four swipeable timelines — Sleep, Awake, Feed, Supplements.
  - **Sleep** and **Awake** are tracked activities: the button at the top
    says "Start" when nothing's running and "End" when something is —
    that state comes from Firestore, so it survives a reload or switching
    devices. Starting one automatically ends the other. Sleep splits into
    two shades of indigo like Feed does: **Nap** is always offered; **Overnight**
    only appears as a quick-start option during the evening/night window
    (18:00–05:59) — you can still set it manually any time via **+**.
  - **Feed** and **Supplements** are single moments, not something you
    start and stop — tapping "Log Breastmilk"/"Log Formula" (two shades of
    green) or "Log Vitamin D"/"Log Iron" (two shades of red) logs it
    immediately at that timestamp. Add a feed amount afterward by tapping
    the entry in the list below.
- Tap **+** any time to add or edit an entry manually with exact times —
  useful for backdating something you forgot to start/stop live.
- **Calendar** tab: a day or week grid like a calendar app, blocks for
  sleep/awake and dots for feeds and supplements.
- **Stats** tab: weekly/monthly charts of sleep vs. awake hours, feed
  counts, and supplement counts.
- **Lock**: signs out of the shared account on this device.

## Local development

```sh
bun install
cp .env.example .env.local   # fill in your Firebase config
bun run dev
```

## Deploying manually

```sh
bun install
bun run build   # outputs to dist/
```

Upload `dist/` to any static host, or rely on the included
`.github/workflows/deploy.yml`.
