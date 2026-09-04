import { getToken } from "firebase/messaging";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, messagingPromise } from "./firebase";
import { getDeviceId } from "./device";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

function firebaseConfigQuery() {
  return new URLSearchParams({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }).toString();
}

/** True once this browser has granted notification permission — the
 * per-device half of "are notifications on" (the other half is the shared
 * Firestore flag both of you see the same value for). */
export function hasDevicePermission() {
  return typeof Notification !== "undefined" && Notification.permission === "granted";
}

/** Requests permission (if needed) and registers this device's push token.
 * Returns false if permission was denied or push isn't supported here. */
export async function registerThisDevice(): Promise<boolean> {
  if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) return false;
  if (!VAPID_KEY) {
    console.error("VITE_FIREBASE_VAPID_KEY is not set — can't register for push.");
    return false;
  }

  const messaging = await messagingPromise;
  if (!messaging) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${firebaseConfigQuery()}`,
  );
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) throw new Error("Firebase didn't return a push token");

  await setDoc(doc(db, "devices", token), {
    deviceId: getDeviceId(),
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  });
  return true;
}
