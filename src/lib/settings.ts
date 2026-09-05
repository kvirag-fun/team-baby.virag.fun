import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const settingsDoc = doc(db, "settings", "app");

/** Everything held in settings/app, delivered by a single listener.
 *
 * The name and the notifications flag used to have a listener each. Firestore
 * bills a read per document per listener, so that doc was read twice on every
 * subscribe — and useSubscription re-subscribes whenever the app comes back to
 * the foreground, so it was twice per foreground, forever. One listener, two
 * values. */
export interface AppSettings {
  babyName: string;
  notificationsEnabled: boolean;
}

export const NO_APP_SETTINGS: AppSettings = { babyName: "", notificationsEnabled: false };

export function subscribeAppSettings(
  onChange: (settings: AppSettings) => void,
  onError: (err: Error) => void,
) {
  return onSnapshot(
    settingsDoc,
    (snap) =>
      onChange({
        babyName: (snap.data()?.babyName as string | undefined) ?? "",
        notificationsEnabled: (snap.data()?.notificationsEnabled as boolean | undefined) ?? false,
      }),
    onError,
  );
}

export async function setBabyName(name: string) {
  await setDoc(settingsDoc, { babyName: name.trim() }, { merge: true });
}

/** Shared master switch: whether the Cloud Function should push
 * notifications at all. Each device also separately needs browser
 * notification permission granted to actually receive anything — see
 * src/lib/notifications.ts. Read through subscribeAppSettings. */
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
