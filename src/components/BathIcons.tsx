import { createLucideIcon } from "lucide-react";

// lucide has none of these, so all three are drawn through its own factory —
// same 24x24 grid, stroke width, caps and joins as the icons beside them.

/** A butt wash. The peach silhouette: a notch at the top and a full crease,
 * which is what separates it from a plain blob — the versions without the
 * notch read as a bag or a coffee bean. */
export const Butt = createLucideIcon("Butt", [
  [
    "path",
    {
      d: "M12 8.4c-1.3-2.2-3.3-2.8-5.1-2C4.8 7.3 3.7 9.6 3.7 12.8c0 4.3 3.7 7.7 8.3 7.7s8.3-3.4 8.3-7.7c0-3.2-1.1-5.5-3.2-6.4-1.8-.8-3.8-.2-5.1 2z",
      key: "cheeks",
    },
  ],
  ["path", { d: "M12 8.6V20", key: "crease" }],
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
