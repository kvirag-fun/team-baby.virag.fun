import { CalendarDays, ListChecks, Plus, BarChart3, Lock } from "lucide-react";

export type Tab = "timeline" | "calendar" | "stats";

/** How much room the fixed nav needs at the bottom of a scrolling region:
 * its measured 55px of buttons plus whatever the device reserves for the home
 * indicator.
 *
 * The `max(..., 8px)` is insurance for the non-translucent status bar (see
 * index.html): if iOS decides it reserves the home-indicator strip itself, the
 * inset reads 0 and the buttons would otherwise sit right on top of it. Where
 * the inset is real it is far larger than 8px, so this changes nothing. */
const BOTTOM_SAFE = "max(env(safe-area-inset-bottom), 8px)";
export const NAV_CLEARANCE = `calc(55px + ${BOTTOM_SAFE})`;

export function BottomNav({
  tab,
  onTab,
  onAdd,
  onLock,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  onAdd: () => void;
  onLock: () => void;
}) {
  const item = (t: Tab, Icon: typeof ListChecks, label: string) => (
    <button
      onClick={() => onTab(t)}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
        tab === t ? "text-indigo-300" : "text-slate-500"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );

  // Pinned to the viewport bottom, overlaying the content; the scrolling
  // region reserves NAV_CLEARANCE for it. In normal flow at the end of the
  // app's column it sat visibly higher, because that column is `h-dvh` and
  // `dvh` carries the same short measurement this whole bug is about.
  //
  // Deliberately no backdrop-blur: iOS composites a backdrop-filtered element
  // on its own layer and paints it at a stale offset while scrolling, which
  // tore the nav across the middle of the list. That, not the positioning,
  // was what made it float.
  return (
    <nav data-bottom-nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-800 bg-slate-950" style={{ paddingBottom: BOTTOM_SAFE }}>
      <div className="relative mx-auto flex max-w-md items-center">
        {item("timeline", ListChecks, "Log")}
        {item("calendar", CalendarDays, "Calendar")}
        <div className="flex flex-1 justify-center">
          <button
            onClick={onAdd}
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-950"
            aria-label="Add entry"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
        {item("stats", BarChart3, "Stats")}
        <button
          onClick={onLock}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs text-slate-500"
        >
          <Lock className="h-5 w-5" />
          Lock
        </button>
      </div>
    </nav>
  );
}
