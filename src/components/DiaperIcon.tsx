import { createLucideIcon } from "lucide-react";

// lucide has no diaper icon, so this is a custom one built through lucide's
// own factory — that way it's a real LucideIcon (same 24x24 grid, stroke
// width, caps and joins, same props) and doesn't look foreign sitting next
// to Moon/Milk/Pill.
//
// Front view: a flat waistband across the top, rounded flaps out to each
// hip, tapering to a rounded bottom. Earlier attempts that came to a point
// read as a funnel or an arrow, and a symmetric pinched-waist version read
// as an hourglass — the rounded bottom and the flaps are what make it
// legible as a diaper, and both survive down to the 18px used in the log
// list.
//
// The centre line is the wetness indicator strip real diapers have. It's
// drawn in the same inherited stroke colour as the outline, like every other
// icon in the app — it reads as part of the diaper rather than as its own
// object, and it takes on the entry's palette instead of fighting it.
export const Diaper = createLucideIcon("Diaper", [
  [
    "path",
    {
      d: "M4 6h16c2 0 2.5 1.5 2 3.5-.4 1.4-1.8 1.5-3 1.5 0 4.5-3 8-7 8s-7-3.5-7-8c-1.2 0-2.6-.1-3-1.5C1.5 7.5 2 6 4 6z",
      key: "diaper",
    },
  ],
  ["path", { d: "M12 9v7", key: "indicator" }],
]);

/** The poopy variant. lucide has no poop either, so this is the familiar
 * three-mound pile, drawn as one silhouette with no face. */
export const Poop = createLucideIcon("Poop", [
  [
    "path",
    {
      d: "M4 21h16a4 4 0 0 0-2.6-3.7A3.4 3.4 0 0 0 15 11.6 3 3 0 0 0 12.2 7 2.6 2.6 0 0 0 11 2.5c.6 1.5.2 2.6-.7 3.4-1.3 1.1-1.5 2.4-1 3.6a3.4 3.4 0 0 0-2.8 4.6A4 4 0 0 0 4 21z",
      key: "pile",
    },
  ],
]);
