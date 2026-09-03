export type EntryType = "sleep" | "awake" | "feed" | "supplement";
export type FeedType = "formula" | "breastmilk";
export type SleepType = "nap" | "overnight";
export type SupplementType = "vitaminD" | "iron";
export type AmountUnit = "ml" | "oz";

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
  amount: number | null;
  amountUnit: AmountUnit | null;
  note: string;
  createdAt: number;
  updatedAt: number;
}

export type NewEntry = Omit<Entry, "id" | "createdAt" | "updatedAt">;
