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
// The centre strip is the wetness indicator real diapers have: it runs the
// full length from the waistband down, yellow when dry and turning blue from
// the bottom as it gets wet — drawn here caught partway.
// Those two are the only hardcoded colours in the app's iconography — every
// other icon is monochrome and inherits its colour from the entry's own
// palette. The strip has to keep its real colours to mean anything, so it
// overrides `stroke` per path; it's drawn thicker than the outline so it
// still reads as two tones at small sizes rather than a single dark dash.
export const Diaper = createLucideIcon("Diaper", [
  [
    "path",
    {
      d: "M4 6h16c2 0 2.5 1.5 2 3.5-.4 1.4-1.8 1.5-3 1.5 0 4.5-3 8-7 8s-7-3.5-7-8c-1.2 0-2.6-.1-3-1.5C1.5 7.5 2 6 4 6z",
      key: "diaper",
    },
  ],
  ["path", { d: "M12 7.5v6", stroke: "#facc15", strokeWidth: "3", key: "indicator-dry" }],
  ["path", { d: "M12 13.5v3", stroke: "#2563eb", strokeWidth: "3", key: "indicator-wet" }],
]);
