import { createLucideIcon } from "lucide-react";

// lucide has none of these, so all three are drawn through its own factory —
// same 24x24 grid, stroke width, caps and joins as the icons beside them.

/** A butt wash. Each cheek is a true circular arc rather than a hand-fitted
 * curve — Béziers kept flattening along the outside and coming out blocky.
 * They meet above the point each one bottoms out at, so the two read as
 * separate lobes instead of one blob. Radius 6.4 about (7.4, 11.8) and its
 * mirror, which fills the box to x 1–23 without the stroke clipping. */
export const Butt = createLucideIcon("Butt", [
  ["path", { d: "M5.21 5.79A6.4 6.4 0 1 0 12 16.25", key: "left-cheek" }],
  ["path", { d: "M18.79 5.79A6.4 6.4 0 1 1 12 16.25", key: "right-cheek" }],
  ["path", { d: "M12 16.25c.1-2.6-.3-4.6-1.6-6", key: "crease" }],
]);

/** A bath. A baby's face — eyes as round-capped dots, the way lucide draws
 * its own, and a smile. */
export const BabyFace = createLucideIcon("BabyFace", [
  ["circle", { cx: "12", cy: "14", r: "7.5", key: "head" }],
  ["path", { d: "M9.2 12.5h.01M14.8 12.5h.01", key: "eyes" }],
  ["path", { d: "M9.3 17a3.5 3.5 0 0 0 5.4 0", key: "smile" }],
]);

/** A hair wash. The same face, dropped slightly and shrunk to make room for
 * three tufts standing up off the top of the head. */
export const HairWash = createLucideIcon("HairWash", [
  ["circle", { cx: "12", cy: "15", r: "7", key: "head" }],
  ["path", { d: "M9.4 13.5h.01M14.6 13.5h.01", key: "eyes" }],
  ["path", { d: "M9.5 17.8a3.3 3.3 0 0 0 5 0", key: "smile" }],
  ["path", { d: "M8.6 8.6 7.4 5.4M12 8v-3.6M15.4 8.6l1.2-3.2", key: "hair" }],
]);
