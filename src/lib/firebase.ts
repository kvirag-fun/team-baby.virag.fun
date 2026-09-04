import { initializeApp } from "firebase/app";
import { browserLocalPersistence, initializeAuth, indexedDBLocalPersistence } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
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
export const db = initializeFirestore(app, {});

// Region must match where the Cloud Function is deployed (functions/index.js).
export const functions = getFunctions(app, "europe-central2");

// Not every browser supports FCM (e.g. no iOS Safari support outside an
// installed PWA) — resolve to null rather than throwing on unsupported ones.
export const messagingPromise: Promise<Messaging | null> = isSupported().then((ok) =>
  ok ? getMessaging(app) : null,
);
