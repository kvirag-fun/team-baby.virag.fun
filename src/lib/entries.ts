import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Entry, NewEntry } from "./types";

const entriesCol = collection(db, "entries");

function fromDoc(id: string, data: Record<string, unknown>): Entry {
  const ts = (v: unknown) => (v instanceof Timestamp ? v.toMillis() : (v as number | null));
  return {
    id,
    type: data.type as Entry["type"],
    startTime: ts(data.startTime) as number,
    endTime: ts(data.endTime),
    feedType: (data.feedType as Entry["feedType"]) ?? null,
    sleepType: (data.sleepType as Entry["sleepType"]) ?? null,
    amount: (data.amount as number | undefined) ?? null,
    amountUnit: (data.amountUnit as Entry["amountUnit"]) ?? null,
    note: (data.note as string | undefined) ?? "",
    createdAt: ts(data.createdAt) ?? 0,
    updatedAt: ts(data.updatedAt) ?? 0,
  };
}

export function subscribeEntries(onChange: (entries: Entry[]) => void, onError: (err: Error) => void) {
  const q = query(entriesCol, orderBy("startTime", "desc"));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => fromDoc(d.id, d.data()))),
    onError,
  );
}

export async function createEntry(entry: NewEntry) {
  await addDoc(entriesCol, {
    ...entry,
    startTime: Timestamp.fromMillis(entry.startTime),
    endTime: entry.endTime != null ? Timestamp.fromMillis(entry.endTime) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateEntry(id: string, entry: NewEntry) {
  await updateDoc(doc(entriesCol, id), {
    ...entry,
    startTime: Timestamp.fromMillis(entry.startTime),
    endTime: entry.endTime != null ? Timestamp.fromMillis(entry.endTime) : null,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEntry(id: string) {
  await deleteDoc(doc(entriesCol, id));
}
