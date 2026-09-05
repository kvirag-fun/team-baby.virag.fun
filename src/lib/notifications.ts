import { getToken } from "firebase/messaging";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import type { EntryType } from "./types";
import { db, messagingPromise } from "./firebase";
import { getDeviceId } from "./device";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/** Which activities this phone wants pushed to it. Kept per device rather
 * than in shared settings, so the two of you can want different things, and
 * stored on the device's own doc — which the Cloud Function already reads to
 * build its send list — rather than in a new collection needing new rules.
 *
 * Absent means all of them: a phone that has never opened this sheet, and
 * every device registered before the feature existed, behave as before. */
export type NotificationTypes = Record<EntryType, boolean>;

export const ALL_NOTIFICATION_TYPES: NotificationTypes = {
  sleep: true,
  awake: true,
  feed: true,
  supplement: true,
  diaper: true,
  bath: true,
};

function typesFrom(data: Record<string, unknown> | undefined): NotificationTypes {
  const stored = (data?.types ?? {}) as Partial<NotificationTypes>;
  return { ...ALL_NOTIFICATION_TYPES, ...stored };
}

/** This device's doc, found by its stable deviceId rather than by push token,
 * which iOS rotates on its own. */
function thisDeviceQuery() {
  return query(collection(db, "devices"), where("deviceId", "==", getDeviceId()));
}

export function subscribeNotificationTypes(
  onChange: (types: NotificationTypes) => void,
  onError: (err: Error) => void,
) {
  return onSnapshot(thisDeviceQuery(), (snap) => onChange(typesFrom(snap.docs[0]?.data())), onError);
}

/** No-op when this device has no doc yet — that only happens while
 * notifications are off, when these toggles are disabled anyway. */
export async function setNotificationTypes(types: NotificationTypes) {
  const snap = await getDocs(thisDeviceQuery());
  await Promise.all(snap.docs.map((d) => setDoc(d.ref, { types }, { merge: true })));
}

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
  // Carry the notification preferences across a token rotation — otherwise a
  // rotation iOS did on its own would silently reset them.
  const carried = priorTokens.docs.map((d) => d.data().types).find(Boolean);
  await setDoc(doc(db, "devices", token), {
    deviceId,
    createdAt: existing?.data().createdAt ?? serverTimestamp(),
    lastSeen: serverTimestamp(),
    ...(carried ? { types: carried } : {}),
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
  } catch (err) {
    console.error("touchLastSeen failed:", err);
  }
}
