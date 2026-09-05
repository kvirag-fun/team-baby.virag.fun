import { createLucideIcon } from "lucide-react";

// lucide has no butt, so this one is drawn through its own factory — same
// 24x24 grid, stroke width, caps and joins as the icons beside it. The two
// wash faces that used to live here are gone: body wash now uses lucide's
// Baby with the hair removed (see BabyIcon.tsx), and hair wash uses lucide's
// Baby as it comes, curl and all.

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
