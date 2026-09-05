export type EntryType = "sleep" | "awake" | "feed" | "supplement" | "diaper" | "bath";
export type FeedType = "formula" | "breastmilk";
/** Which breast a breastmilk feed came from. Null on a bottle, and on any
 * breastmilk feed logged before this was tracked. */
export type FeedSide = "left" | "right";
/** What was in the bottle. Null on a boob feed, and on any bottle logged
 * before this was tracked. Distinct from feedType, which says how the feed
 * happened rather than what it was. */
export type BottleContent = "breastmilk" | "formula";
export type SleepType = "nap" | "overnight";
export type SupplementType = "vitaminD" | "iron";
export type DiaperType = "wet" | "poopy";
export type BathType = "bath" | "butt" | "hairWash";
export type AmountUnit = "ml" | "oz";

/** Types that happen at a single moment rather than over a stretch of time —
 * they carry only a timestamp, never an end time or duration. Defined once
 * here rather than repeated per component so adding a type can't leave one
 * view still treating it as a range. */
export const POINT_TYPES = ["feed", "supplement", "diaper", "bath"] as const;
export const isPointType = (t: EntryType) => (POINT_TYPES as readonly EntryType[]).includes(t);

export interface Entry {
  id: string;
  type: EntryType;
  /** epoch millis */
  startTime: number;
  /** epoch millis; null while an ongoing sleep/awake stretch has no end yet */
  endTime: number | null;
  feedType: FeedType | null;
  feedSide: FeedSide | null;
  bottleContent: BottleContent | null;
  sleepType: SleepType | null;
  supplementType: SupplementType | null;
  diaperType: DiaperType | null;
  bathType: BathType | null;
  amount: number | null;
  amountUnit: AmountUnit | null;
  note: string;
  createdAt: number;
  updatedAt: number;
}

export type NewEntry = Omit<Entry, "id" | "createdAt" | "updatedAt">;
