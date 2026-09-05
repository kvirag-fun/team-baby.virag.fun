import { createLucideIcon } from "lucide-react";

/** lucide's own Baby icon with the hair curl taken off (lucide is ISC
 * licensed).
 *
 * Its eyes and mouth are copied verbatim. The fourth path draws the head, the
 * two ear bumps and the curl as one stroke: it runs clockwise from (19, 6.3)
 * down the right side, around the bottom, up the left, and stops at the top
 * (12, 3), where the curl then peels off to the right. So the head is not a
 * closed circle in the original — there is a 130° gap at the top right that
 * the hair fills.
 *
 * Measuring the on-curve points shows every one of them sitting on a single
 * circle of radius ~9 centred at (12, 11.91). Removing the curl is therefore
 * not a redraw: the same arc simply carries on past (12, 3) and closes on the
 * point it started from. Nothing else moves by a hair — ears, eyes, mouth and
 * the head's size and position are lucide's, to the decimal. */
export const BabyHairless = createLucideIcon("BabyHairless", [
  ["path", { d: "M9 12h.01", key: "left-eye" }],
  ["path", { d: "M15 12h.01", key: "right-eye" }],
  ["path", { d: "M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5", key: "mouth" }],
  [
    "path",
    {
      // Identical to lucide's up to the final arc, which replaces `A9 9 0 0 1
      // 12 3` plus the curl by continuing to the start point instead.
      d: "M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 19 6.3",
      key: "head",
    },
  ],
]);
