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

const messaging = firebase.messaging();

// Push delivery is "at least once", not "exactly once" — FCM/APNs can
// redeliver the same message even after reporting a single successful send
// (confirmed independently: the backend sends exactly once per log action,
// yet a real device still showed the notification twice, even surviving a
// full app reinstall). Each send carries a unique dedupeId (data.dedupeId);
// remember which ones this device has already shown and skip a repeat.
// Uses the Cache API rather than IndexedDB purely for its simpler API — this
// isn't caching network responses, just a small persistent set of seen ids.
async function alreadyShown(dedupeId) {
  if (!dedupeId) return false;
  const cache = await caches.open("shown-notification-ids");
  if (await cache.match(dedupeId)) return true;
  await cache.put(dedupeId, new Response(""));
  return false;
}

messaging.onBackgroundMessage(async (payload) => {
  if (await alreadyShown(payload.data?.dedupeId)) return;
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "Team Baby", {
    body: body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  });
});
