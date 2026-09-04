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

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "Team Baby", {
    body: body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  });
});
