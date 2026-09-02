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
