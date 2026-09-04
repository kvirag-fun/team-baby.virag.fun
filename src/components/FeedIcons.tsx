import { createLucideIcon } from "lucide-react";

// lucide has neither a breast nor a baby bottle — its Milk is a carton — so
// both are drawn here through lucide's own factory, which keeps them on the
// same 24x24 grid with the same stroke width, caps and joins as the icons
// they sit beside.

/** Breastmilk. A teardrop with the nipple at its centre: the rounder
 * silhouettes tried first read as a ball or an eye at list size, and the ones
 * with the nipple bumped out of the outline came out looking bitten. */
export const Breast = createLucideIcon("Breast", [
  // Sized to stand exactly as tall as the bottle (both 21.2 units in the
  // 24x24 box, spanning y 1.3 to 22.5) so the two read as a matched pair in
  // a row. Scaled from the original 15-unit-tall drawing about its own
  // vertical axis, which widens it past the bottle — a teardrop is far
  // squatter than a bottle, so equal height cannot also mean equal width.
  [
    "path",
    {
      d: "M12 1.3c-1.41 5.65-8.48 7.07-8.48 12.72a8.48 8.48 0 0 0 16.96 0c0-5.65-7.07-7.07-8.48-12.72z",
      key: "breast",
    },
  ],
  ["circle", { cx: "12", cy: "16.85", r: "2.26", key: "nipple" }],
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
