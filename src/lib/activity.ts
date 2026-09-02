import { createEntry, updateEntry } from "./entries";
import type { Entry, EntryType, FeedType } from "./types";

/** The currently-running entry of a type, if any (endTime === null means "still going"). */
export function findOpenEntry(entries: Entry[], type: EntryType): Entry | null {
  return entries.find((e) => e.type === type && e.endTime == null) ?? null;
}

export async function stopEntry(entry: Entry, endTime = Date.now()) {
  await updateEntry(entry.id, {
    type: entry.type,
    startTime: entry.startTime,
    endTime,
    feedType: entry.feedType,
    amount: entry.amount,
    amountUnit: entry.amountUnit,
    note: entry.note,
  });
}

/** Starts sleep or awake now; if the other of the pair is running, closes it first. */
export async function startSleepOrAwake(entries: Entry[], type: "sleep" | "awake") {
  const now = Date.now();
  const other: EntryType = type === "sleep" ? "awake" : "sleep";
  const openOther = findOpenEntry(entries, other);
  if (openOther) await stopEntry(openOther, now);
  await createEntry({
    type,
    startTime: now,
    endTime: null,
    feedType: null,
    amount: null,
    amountUnit: null,
    note: "",
  });
}

export async function startFeed(feedType: FeedType) {
  await createEntry({
    type: "feed",
    startTime: Date.now(),
    endTime: null,
    feedType,
    amount: null,
    amountUnit: "ml",
    note: "",
  });
}
