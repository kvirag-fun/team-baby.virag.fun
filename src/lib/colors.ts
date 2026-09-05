import type { Entry } from "./types";

// Distinct hues per activity (sleep / awake / feed / supplement / diaper);
// sleep, feed, and supplement each split into two shades of their hue so
// they still read as the same activity while distinguishing the sub-type
// (nap vs overnight, formula vs breastmilk, vitamin D vs iron).
//
// Diaper deliberately breaks that one-hue rule: wet and poopy have obvious
// real-world colours, and reading them at a glance matters more here than
// the two sub-types matching each other. Sky is far enough from every other
// hue in use, and amber-700 is a dark brown that doesn't collide with either
// awake (amber-400, bright yellow) or iron (red-800).
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
  diaperWet: {
    bg: "bg-sky-300",
    text: "text-sky-950",
    ring: "ring-sky-200",
    dot: "#7dd3fc",
  },
  // Fuchsia for washing: every other hue is taken, and the near ones that
  // aren't — teal beside feed's emerald, violet beside sleep's indigo —
  // would be hard to tell apart at the size the calendar draws them.
  bathFull: {
    bg: "bg-fuchsia-300",
    text: "text-fuchsia-950",
    ring: "ring-fuchsia-200",
    dot: "#f0abfc",
  },
  bathButt: {
    bg: "bg-fuchsia-500",
    text: "text-fuchsia-50",
    ring: "ring-fuchsia-400",
    dot: "#d946ef",
  },
  bathHair: {
    bg: "bg-fuchsia-800",
    text: "text-fuchsia-50",
    ring: "ring-fuchsia-600",
    dot: "#86198f",
  },
  diaperPoopy: {
    bg: "bg-amber-700",
    text: "text-amber-50",
    ring: "ring-amber-600",
    dot: "#b45309",
  },
} as const;

type Described = Pick<Entry, "type" | "feedType" | "sleepType" | "supplementType" | "diaperType" | "bathType">;

export function colorFor(entry: Described) {
  if (entry.type === "sleep") return entry.sleepType === "overnight" ? COLORS.sleepOvernight : COLORS.sleepNap;
  if (entry.type === "awake") return COLORS.awake;
  if (entry.type === "supplement") return entry.supplementType === "iron" ? COLORS.supplementIron : COLORS.supplementVitaminD;
  if (entry.type === "diaper") return entry.diaperType === "poopy" ? COLORS.diaperPoopy : COLORS.diaperWet;
  if (entry.type === "bath") {
    if (entry.bathType === "butt") return COLORS.bathButt;
    return entry.bathType === "hairWash" ? COLORS.bathHair : COLORS.bathFull;
  }
  return entry.feedType === "breastmilk" ? COLORS.feedBreastmilk : COLORS.feedFormula;
}

export function labelFor(entry: Described) {
  if (entry.type === "sleep") return entry.sleepType === "overnight" ? "Overnight" : "Nap";
  if (entry.type === "awake") return "Awake";
  if (entry.type === "supplement") return entry.supplementType === "iron" ? "Iron" : "Vitamin D";
  if (entry.type === "diaper") return entry.diaperType === "poopy" ? "Poopy" : "Wet";
  if (entry.type === "bath") {
    if (entry.bathType === "butt") return "Butt";
    return entry.bathType === "hairWash" ? "Hair wash" : "Bath";
  }
  return entry.feedType === "breastmilk" ? "Boob" : "Bottle";
}
