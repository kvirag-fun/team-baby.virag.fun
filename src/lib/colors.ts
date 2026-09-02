import type { Entry } from "./types";

// Three distinct hues (sleep / awake / feed); feed splits into two shades of
// the same green so it still reads as "feed" while distinguishing the type.
export const COLORS = {
  sleep: { bg: "bg-indigo-500", text: "text-indigo-950", ring: "ring-indigo-400", dot: "#6366f1" },
  awake: { bg: "bg-amber-400", text: "text-amber-950", ring: "ring-amber-300", dot: "#fbbf24" },
  feedFormula: {
    bg: "bg-emerald-300",
    text: "text-emerald-950",
    ring: "ring-emerald-200",
    dot: "#6ee7b7",
  },
  feedBreastmilk: {
    bg: "bg-emerald-700",
    text: "text-emerald-50",
    ring: "ring-emerald-500",
    dot: "#047857",
  },
} as const;

export function colorFor(entry: Pick<Entry, "type" | "feedType">) {
  if (entry.type === "sleep") return COLORS.sleep;
  if (entry.type === "awake") return COLORS.awake;
  return entry.feedType === "breastmilk" ? COLORS.feedBreastmilk : COLORS.feedFormula;
}

export function labelFor(entry: Pick<Entry, "type" | "feedType">) {
  if (entry.type === "sleep") return "Sleep";
  if (entry.type === "awake") return "Awake";
  return entry.feedType === "breastmilk" ? "Breastmilk" : "Formula";
}
