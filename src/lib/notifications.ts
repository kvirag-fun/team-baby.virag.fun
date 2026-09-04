import { getToken } from "firebase/messaging";
import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
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

/** Writes this device's current token, always pruning any other token doc
 * sharing the same deviceId first. iOS can rotate a device's push token on
 * its own between explicit registrations (not just on reinstall) — if that
 * rotation is only handled at bell-toggle time, the orphaned old token stays
 * "fresh" (still getting its lastSeen touched under the old code) and keeps
 * receiving duplicate pushes indefinitely instead of ever aging out. */
async function upsertDeviceToken(token: string, deviceId: string): Promise<void> {
  const priorTokens = await getDocs(query(collection(db, "devices"), where("deviceId", "==", deviceId)));
  await Promise.all(priorTokens.docs.filter((d) => d.id !== token).map((d) => deleteDoc(d.ref)));

  const existing = priorTokens.docs.find((d) => d.id === token);
  await setDoc(doc(db, "devices", token), {
    deviceId,
    createdAt: existing?.data().createdAt ?? serverTimestamp(),
    lastSeen: serverTimestamp(),
  });
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

  await upsertDeviceToken(token, getDeviceId());
  return true;
}

/** Refreshes this device's token/lastSeen so it doesn't look abandoned, and
 * catches a token rotation (see upsertDeviceToken) before it can cause a
 * duplicate. Call this on every app load while notifications are already
 * on — an install that's actually in use stays "fresh" forever, while one
 * truly orphaned by a reinstall (its old token/deviceId can no longer be
 * reached to delete directly, since that browser storage is gone) stops
 * getting touched and ages out on its own via the pruning in
 * notifyOnNewEntry, instead of needing anyone to find and delete it by hand
 * in the Firebase console. */
export async function touchLastSeen(): Promise<void> {
  if (!hasDevicePermission() || !VAPID_KEY) return;
  try {
    const messaging = await messagingPromise;
    if (!messaging) return;
    const registration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${firebaseConfigQuery()}`,
    );
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    if (!token) return;
    await upsertDeviceToken(token, getDeviceId());

    // Temporary — duplicates persisted through two fixes now, so show the
    // actual current state directly instead of guessing further.
    const all = await getDocs(collection(db, "devices"));
    const deviceId = getDeviceId();
    alert(
      `This device: ${deviceId.slice(0, 8)}… / token ${token.slice(0, 8)}…\nAll registered (${all.size}):\n` +
        all.docs
          .map((d) => `- token ${d.id.slice(0, 8)}… deviceId=${(d.data().deviceId ?? "?").slice(0, 8)}…`)
          .join("\n"),
    );
  } catch (err) {
    console.error("touchLastSeen failed:", err);
  }
}
