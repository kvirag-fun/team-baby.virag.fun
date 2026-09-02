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
  (`family@team-baby.local`) may read or write, and that account's
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
   - Email: `family@team-baby.local`
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
Users > the `family@team-baby.local` row > reset password. No redeploy
needed.

## Using the app

- Tap **+** to log Sleep, Awake, or a Feed (Formula / Breastmilk, with
  amount). Sleep/Awake are time ranges — leave "still going" checked for
  an entry with no end yet, then edit it later to close it out.
- **Timeline** tab: chronological list, filterable by type; entries are
  color-coded (indigo = sleep, amber = awake, two shades of green = the
  two feed types).
- **Calendar** tab: a day or week grid like a calendar app, blocks for
  sleep/awake and dots for feeds.
- **Stats** tab: weekly/monthly charts of sleep vs. awake hours and feed
  counts.
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
