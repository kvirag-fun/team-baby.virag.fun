import { initializeApp } from "firebase/app";
import { browserLocalPersistence, initializeAuth, indexedDBLocalPersistence } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

// Not a secret: a Firebase web config only identifies the project. Real
// access control is enforced server-side by Firestore Security Rules (see
// firestore.rules), which restrict every read/write to the one shared
// account below. Injected at build time from the FIREBASE_CONFIG secret so
// the project identity itself isn't hardcoded into public git history.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// The single shared account both of you sign into. Its password is the
// "site password" — set it in the Firebase Console (Authentication > Users).
export const SHARED_EMAIL = "timka@team.family";

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
});
export const db = initializeFirestore(app, {});
