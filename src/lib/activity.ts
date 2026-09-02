import { createEntry, updateEntry } from "./entries";
import type { Entry, EntryType, FeedType } from "./types";

/**
 * The currently-running entry of a type, if any (endTime === null means
 * "still going"). Only meaningful for sleep/awake — feed entries always have
 * endTime === null since feed is a single moment, not a tracked range, so
 * this should not be called with type "feed".
 */
export function findOpenEntry(entries: Entry[], type: "sleep" | "awake"): Entry | null {
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

/** Feed is a single moment, not a tracked range — endTime is always null/unused. */
export async function logFeed(feedType: FeedType) {
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
