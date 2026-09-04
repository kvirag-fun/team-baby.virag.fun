import { initializeApp } from "firebase/app";
import { browserLocalPersistence, initializeAuth, indexedDBLocalPersistence } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

// Not a secret: a Firebase web config only identifies the project. Real
// access control is enforced server-side by Firestore Security Rules (see
// firestore.rules), which restrict every read/write to the family's own
// accounts. Injected at build time from the FIREBASE_CONFIG secret so the
// project identity itself isn't hardcoded into public git history.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
});
// Cached in IndexedDB so an app open renders last-known data immediately
// instead of blocking on a server round-trip. Without this the app has
// nothing at all to show until Firestore answers, and an installed PWA
// resumed with a dead connection sits on "Loading…" indefinitely. The
// multi-tab manager keeps Safari and the installed app in step when both
// are open on the same phone. Falls back to an in-memory cache on its own
// if IndexedDB is unavailable (private browsing).
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

// Region must match where the Cloud Function is deployed (functions/index.js).
export const functions = getFunctions(app, "europe-central2");

// Not every browser supports FCM (e.g. no iOS Safari support outside an
// installed PWA) — resolve to null rather than throwing on unsupported ones.
export const messagingPromise: Promise<Messaging | null> = isSupported().then((ok) =>
  ok ? getMessaging(app) : null,
);
