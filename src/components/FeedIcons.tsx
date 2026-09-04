import { createLucideIcon } from "lucide-react";

// lucide has neither a breast nor a baby bottle — its Milk is a carton — so
// both are drawn here through lucide's own factory, which keeps them on the
// same 24x24 grid with the same stroke width, caps and joins as the icons
// they sit beside.

/** Breastmilk. A teardrop with the nipple at its centre: the rounder
 * silhouettes tried first read as a ball or an eye at list size, and the ones
 * with the nipple bumped out of the outline came out looking bitten. */
export const Breast = createLucideIcon("Breast", [
  // Drawn 15% larger than the shape it started from, scaled about its own
  // centre so it stays balanced in the 24x24 box — it sat visibly smaller
  // than the bottle beside it otherwise.
  [
    "path",
    { d: "M12 1.88c-1.15 4.6-6.9 5.75-6.9 10.35a6.9 6.9 0 0 0 13.8 0c0-4.6-5.75-5.75-6.9-10.35z", key: "breast" },
  ],
  ["circle", { cx: "12", cy: "14.53", r: "1.84", key: "nipple" }],
]);

/** Formula. A baby bottle rather than a generic one: what makes it read as
 * a baby's is the pointed teat and the wide collar under it — a narrow neck
 * looks like a lab flask. The rounded base and the two measurement marks do
 * the rest; without the marks it reads as a lightbulb. */
export const BabyBottle = createLucideIcon("BabyBottle", [
  [
    "path",
    { d: "M12 1.3c-.6 0-1 .8-1.1 1.6-.2 1.4-1.7 1.9-1.7 3.1h5.6c0-1.2-1.5-1.7-1.7-3.1C13 2.1 12.6 1.3 12 1.3z", key: "teat" },
  ],
  ["rect", { x: "8.2", y: "6", width: "7.6", height: "2.2", rx: "1.1", key: "collar" }],
  ["path", { d: "M9 8.2h6a3 3 0 0 1 3 3v5.3a5.5 5.5 0 0 1-12 0v-5.3a3 3 0 0 1 3-3z", key: "body" }],
  ["path", { d: "M8.5 12.5h3M8.5 15h3", key: "marks" }],
]);
