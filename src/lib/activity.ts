import { createEntry, updateEntry } from "./entries";
import type { Entry, FeedType, SleepType } from "./types";

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
    sleepType: entry.sleepType,
    amount: entry.amount,
    amountUnit: entry.amountUnit,
    note: entry.note,
  });
}

/** Starts a sleep stretch now; if awake is running, closes it first. */
export async function startSleep(entries: Entry[], sleepType: SleepType) {
  const now = Date.now();
  const openAwake = findOpenEntry(entries, "awake");
  if (openAwake) await stopEntry(openAwake, now);
  await createEntry({
    type: "sleep",
    startTime: now,
    endTime: null,
    feedType: null,
    sleepType,
    amount: null,
    amountUnit: null,
    note: "",
  });
}

/** Starts an awake stretch now; if sleep is running, closes it first. */
export async function startAwake(entries: Entry[]) {
  const now = Date.now();
  const openSleep = findOpenEntry(entries, "sleep");
  if (openSleep) await stopEntry(openSleep, now);
  await createEntry({
    type: "awake",
    startTime: now,
    endTime: null,
    feedType: null,
    sleepType: null,
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
    sleepType: null,
    amount: null,
    amountUnit: "ml",
    note: "",
  });
}
