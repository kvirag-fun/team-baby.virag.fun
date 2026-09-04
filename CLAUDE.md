# Team Baby — notes for Claude Code

Rules and hard-won failure points to check before repeating past mistakes.
Read this before touching auth, Firestore rules, or `functions/`.

## Project facts

1. This repo is **public** (required for free GitHub Pages) — never commit
   real personal data into it. The old single shared login used a
   throwaway address (`timka@team.family`) specifically so it was safe to
   hardcode in `firestore.rules`/`functions/index.js`. If/when this moves
   to real individual per-person logins, their real emails must NOT be
   hardcoded into any committed file — store the allowlist as Firestore
   *data* (e.g. a `settings/app.allowedEmails` field, or per-family
   membership docs) and have rules/functions look it up, not hardcode it.
2. Firebase config, VAPID key, and the CI deploy token are all injected via
   GitHub Actions secrets, never hardcoded — same reasoning as above, kept
   consistent even though the Firebase config itself isn't secret.
3. No general-purpose service worker, deliberately — avoids stale-cache
   bugs. `public/firebase-messaging-sw.js` exists only for background push
   and is registered narrowly by `src/lib/notifications.ts`.
4. **Currently mid-migration**: login screen (`LoginScreen.tsx`/`useAuth.ts`)
   already takes email + password and has forgot-password wired up, but
   `firestore.rules` and `functions/index.js`'s `FAMILY_EMAIL` check are
   still hardcoded to the single old shared email — deliberately not yet
   migrated, pending the user's real emails and a shared-vs-separate
   password decision. Don't assume this is finished.

## Cloud Function (`functions/index.js`) — IAM roles the runtime service
account (`PROJECT_NUMBER-compute@developer.gserviceaccount.com`) needs.
Missing any of these fails differently, discovered the hard way over many
rounds — grant all three up front on any new project:

| Role | What breaks without it |
| --- | --- |
| Cloud Build Service Account | Deploy fails outright (`Could not build the function due to a missing permission on the build service account`) |
| Cloud Datastore User | Deploy succeeds, but every invocation crashes immediately with Firestore `PERMISSION_DENIED` — this is the Admin SDK's own runtime access, separate from and not covered by Firestore Security Rules |
| Firebase Cloud Messaging API Admin | Deploy and invocation both succeed, function reports `{sent: N}` normally — but every actual push silently fails with `messaging/mismatched-credential`. This one is the hardest to catch: nothing looks wrong until you check the per-token error detail |

## `firebase functions:log` is unreliable for this project — don't trust it

Repeatedly showed stale output (frozen at an old timestamp) through
multiple confirmed-successful deploys and confirmed-successful function
invocations, even with `-n 1000`. Wasted significant debugging time before
this was caught. If you need to know what a deployed function is actually
doing:
- Prefer having the function return diagnostic detail directly in its
  response (a version marker, error codes, counts) — the client can then
  surface it (e.g. a temporary `alert()`, since there's no way to read a
  phone's browser console remotely).
- Or curl the function's HTTP endpoint directly from CI to confirm it's
  live and running the expected code, bypassing Cloud Logging entirely.
- Only remove such temporary diagnostics once the real fix is confirmed
  working end-to-end — don't leave them in production.

## Changing a function's trigger type requires deleting it first

Firebase CLI refuses to deploy a function whose trigger type changed (e.g.
Firestore `onDocumentCreated` → HTTPS `onCall`) in place — error is
`Changing from an HTTPS function to a background triggered function is not
allowed` (or the reverse). Fix: `firebase functions:delete <name> --region
<region> --force` once, then deploy fresh. Same applies to any future
trigger-type change.

## Why notifications are an HTTPS callable, not a Firestore trigger

The original design used `onDocumentCreated` (Eventarc). It was
unreliable to deploy (see IAM table above, plus first-time Eventarc/Pub-Sub
propagation issues) and, worse, **silently stopped delivering events**
after working correctly twice — no error, no log entry, nothing observable,
even well past any plausible propagation delay. Switched to an `onCall`
function the client invokes directly right after saving an entry
(fire-and-forget, `src/lib/entries.ts`) specifically to remove Eventarc
from the picture — a failure now surfaces as a normal HTTPS error instead
of vanishing into an unobservable async pipeline. Don't switch back to an
event trigger without a very good reason.

## Device registration: reinstalling the PWA orphans old entries

Reinstalling from Safari resets local storage, so `getDeviceId()` (and the
FCM token) come back different — the *old* `devices/{token}` doc has no
way to be reached and deleted by the client anymore, but the underlying
push subscription can still be live, causing duplicate notifications to
one physical phone. This is now self-healing, not something to manually
fix in Firestore Console again:
- `touchLastSeen()` (`notifications.ts`) runs on every app open while
  notifications are on, keeping an in-use device's `lastSeen` fresh.
- `notifyOnNewEntry` prunes any device doc whose `lastSeen` (or
  `createdAt`, if never touched) is older than `STALE_DEVICE_MS` (3 days)
  before sending, piggybacking on the fetch it already does — no separate
  scheduled function.
- A future reinstall now costs at most a few days of duplicate pushes,
  self-clearing after that.

## iOS PWA stale cache

Even with no general service worker, an installed home-screen PWA can
stubbornly keep serving old JS after a deploy. If a fix is confirmed
deployed but the phone still shows old behavior, the fix is: delete the
app from the home screen and re-add it fresh from Safari. Isolate this
from an actual code bug by testing in plain Safari (not the installed
app) first — if Safari shows the fix working but the installed app
doesn't, it's cache, not code.

## Touch gesture pattern (swipe navigation)

`LogPager.tsx`'s swipe-to-page implementation is the reference: axis-lock
via a small threshold (`SWIPE_AXIS_THRESHOLD`) before committing to
horizontal vs. vertical, `touch-action: pan-y` on the container so native
vertical scroll is untouched until a gesture is confidently horizontal,
manual touchmove/touchend handling only past that point. `CalendarView.tsx`
reuses the same axis-lock/threshold approach for simple swipe-to-navigate
(no bounded pages to drag between, just detect-and-jump). Verify any new
touch gesture with simulated touch events (Playwright CDP
`Input.dispatchTouchEvent`), not just visual screenshots or mouse-based
interactions — mouse events don't exercise `touch-action`/touch code paths
at all.
