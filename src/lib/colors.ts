import type { Entry } from "./types";

// Distinct hues per activity (sleep / awake / feed / supplement); sleep,
// feed, and supplement each split into two shades of their hue so they
// still read as the same activity while distinguishing the sub-type (nap
// vs overnight, formula vs breastmilk, vitamin D vs iron).
export const COLORS = {
  sleepNap: { bg: "bg-indigo-400", text: "text-indigo-950", ring: "ring-indigo-300", dot: "#818cf8" },
  sleepOvernight: {
    bg: "bg-indigo-800",
    text: "text-indigo-50",
    ring: "ring-indigo-600",
    dot: "#3730a3",
  },
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
  supplementVitaminD: {
    bg: "bg-red-300",
    text: "text-red-950",
    ring: "ring-red-200",
    dot: "#fca5a5",
  },
  supplementIron: {
    bg: "bg-red-800",
    text: "text-red-50",
    ring: "ring-red-600",
    dot: "#991b1b",
  },
} as const;

export function colorFor(entry: Pick<Entry, "type" | "feedType" | "sleepType" | "supplementType">) {
  if (entry.type === "sleep") return entry.sleepType === "overnight" ? COLORS.sleepOvernight : COLORS.sleepNap;
  if (entry.type === "awake") return COLORS.awake;
  if (entry.type === "supplement") return entry.supplementType === "iron" ? COLORS.supplementIron : COLORS.supplementVitaminD;
  return entry.feedType === "breastmilk" ? COLORS.feedBreastmilk : COLORS.feedFormula;
}

export function labelFor(entry: Pick<Entry, "type" | "feedType" | "sleepType" | "supplementType">) {
  if (entry.type === "sleep") return entry.sleepType === "overnight" ? "Overnight" : "Nap";
  if (entry.type === "awake") return "Awake";
  if (entry.type === "supplement") return entry.supplementType === "iron" ? "Iron" : "Vitamin D";
  return entry.feedType === "breastmilk" ? "Breastmilk" : "Formula";
}
