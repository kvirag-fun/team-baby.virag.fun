export type EntryType = "sleep" | "awake" | "feed" | "supplement" | "diaper";
export type FeedType = "formula" | "breastmilk";
export type SleepType = "nap" | "overnight";
export type SupplementType = "vitaminD" | "iron";
export type DiaperType = "wet" | "poopy";
export type AmountUnit = "ml" | "oz";

/** Types that happen at a single moment rather than over a stretch of time —
 * they carry only a timestamp, never an end time or duration. Defined once
 * here rather than repeated per component so adding a type can't leave one
 * view still treating it as a range. */
export const POINT_TYPES = ["feed", "supplement", "diaper"] as const;
export const isPointType = (t: EntryType) => (POINT_TYPES as readonly EntryType[]).includes(t);

export interface Entry {
  id: string;
  type: EntryType;
  /** epoch millis */
  startTime: number;
  /** epoch millis; null while an ongoing sleep/awake stretch has no end yet */
  endTime: number | null;
  feedType: FeedType | null;
  sleepType: SleepType | null;
  supplementType: SupplementType | null;
  diaperType: DiaperType | null;
  amount: number | null;
  amountUnit: AmountUnit | null;
  note: string;
  createdAt: number;
  updatedAt: number;
}

export type NewEntry = Omit<Entry, "id" | "createdAt" | "updatedAt">;
