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
