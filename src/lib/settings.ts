import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const settingsDoc = doc(db, "settings", "app");

export function subscribeBabyName(onChange: (name: string) => void, onError: (err: Error) => void) {
  return onSnapshot(
    settingsDoc,
    (snap) => onChange((snap.data()?.babyName as string | undefined) ?? ""),
    onError,
  );
}

export async function setBabyName(name: string) {
  await setDoc(settingsDoc, { babyName: name.trim() }, { merge: true });
}

/** Shared master switch: whether the Cloud Function should push
 * notifications at all. Each device also separately needs browser
 * notification permission granted to actually receive anything — see
 * src/lib/notifications.ts. */
export function subscribeNotificationsEnabled(onChange: (enabled: boolean) => void, onError: (err: Error) => void) {
  return onSnapshot(
    settingsDoc,
    (snap) => onChange((snap.data()?.notificationsEnabled as boolean | undefined) ?? false),
    onError,
  );
}

export async function setNotificationsEnabled(enabled: boolean) {
  await setDoc(settingsDoc, { notificationsEnabled: enabled }, { merge: true });
}

const avatarDoc = doc(db, "settings", "avatar");

/** The baby's photo, held as a data URL in its own document rather than as
 * a field on settings/app. Every screen subscribes to settings/app for the
 * name and the notifications flag, and an image sitting there would ride
 * along with each of those snapshots. Firestore caps a document at ~1 MiB;
 * the client-side downscale (see lib/image.ts) lands around 10–20 KB, far
 * below it, and keeps the full-size original on the phone. */
export function subscribeAvatar(onChange: (dataUrl: string) => void, onError: (err: Error) => void) {
  return onSnapshot(
    avatarDoc,
    (snap) => onChange((snap.data()?.dataUrl as string | undefined) ?? ""),
    onError,
  );
}

/** Pass "" to remove the photo. */
export async function setAvatar(dataUrl: string) {
  await setDoc(avatarDoc, { dataUrl });
}
