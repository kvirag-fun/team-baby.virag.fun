// Handles push notifications while the app isn't in the foreground.
// Not a general asset-caching service worker (deliberately — see README on
// why this app has none) — this one only exists for background FCM
// delivery, registered separately by src/lib/notifications.ts.
//
// The Firebase config isn't secret (see src/lib/firebase.ts), but this is a
// static file Vite can't inject env vars into, so it's passed at
// registration time via the query string instead of hardcoded here.
importScripts("https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js");

const params = new URL(location.href).searchParams;
firebase.initializeApp({
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

// Deliberately no onBackgroundMessage handler. The SDK's own push listener
// already calls showNotification() itself for any message carrying a
// `notification` payload, and *then* also invokes a registered
// onBackgroundMessage handler — so displaying it here too showed every push
// twice. Presentation (icon, badge) is set sender-side in the webpush block
// of functions/index.js instead. Don't add a handler back to "fix" icons or
// text — that reintroduces the duplicate; see CLAUDE.md for the full writeup.
firebase.messaging();

// By default a new worker installs but sits idle until every tab/window
// running the old one is gone — on an installed home-screen PWA that can be
// effectively never, so a fixed worker never takes effect without deleting
// and re-adding the app. Take over as soon as the new version is fetched
// instead. Safe here precisely because this worker caches nothing: there's
// no half-old-half-new asset state for an abrupt swap to land in.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
