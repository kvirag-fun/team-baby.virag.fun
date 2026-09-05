import { createLucideIcon } from "lucide-react";

// lucide has none of these, so all three are drawn through its own factory —
// same 24x24 grid, stroke width, caps and joins as the icons beside them.

/** A butt wash. Each cheek is a true circular arc rather than a hand-fitted
 * curve — Béziers kept flattening along the outside and coming out blocky.
 * They meet above the point each one bottoms out at, so the two read as
 * separate lobes instead of one blob. Radius 5.6 about (7.2, 11.5) and its
 * mirror. */
export const Butt = createLucideIcon("Butt", [
  ["path", { d: "M5.75 6.09A5.6 5.6 0 1 0 12 14.38", key: "left-cheek" }],
  ["path", { d: "M18.25 6.09A5.6 5.6 0 1 1 12 14.38", key: "right-cheek" }],
  ["path", { d: "M12 14.38c.1-2.6-.3-4.6-1.6-6", key: "crease" }],
]);

/** A bath. A baby's face — eyes as round-capped dots, the way lucide draws
 * its own, and a smile. */
export const BabyFace = createLucideIcon("BabyFace", [
  ["circle", { cx: "12", cy: "14", r: "7.5", key: "head" }],
  ["path", { d: "M9.2 12.5h.01M14.8 12.5h.01", key: "eyes" }],
  ["path", { d: "M9.3 17a3.5 3.5 0 0 0 5.4 0", key: "smile" }],
]);

/** A hair wash. No face — just the crown of the head and three tufts
 * standing off it. The tufts entirely on their own were tried and read as
 * three scratches; the scalp line is what makes them hair. */
export const HairWash = createLucideIcon("HairWash", [
  ["path", { d: "M4.5 19.5a7.5 7.5 0 0 1 15 0", key: "crown" }],
  ["path", { d: "M8.4 12.4 6.9 6.6M12 11.5V5.4M15.6 12.4l1.5-5.8", key: "hair" }],
]);
