import { CalendarDays, ListChecks, Plus, BarChart3, Lock } from "lucide-react";
import { useLaunchRelayout } from "@/hooks/useLaunchRelayout";

export type Tab = "timeline" | "calendar" | "stats";

/** How much room the fixed nav needs at the bottom of a scrolling region:
 * its measured 55px of buttons plus whatever the device reserves for the home
 * indicator. */
export const NAV_CLEARANCE = "calc(55px + env(safe-area-inset-bottom))";

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
  // iOS starts an installed PWA with a short layout viewport, which is what
  // `bottom: 0` below resolves against — so without this the bar spends the
  // first moment hanging above the screen edge. See useLaunchRelayout.
  const ref = useLaunchRelayout<HTMLElement>();

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

  // Pinned to the viewport bottom, overlaying the content. In normal flow at
  // the end of the app's column it sat visibly higher on a phone, so it stays
  // fixed and the scrolling region reserves NAV_CLEARANCE for it instead.
  //
  // Deliberately no backdrop-blur: iOS composites a backdrop-filtered element
  // on its own layer and paints it at a stale offset while scrolling, which
  // tore the nav across the middle of the list. That, not the positioning,
  // was what made it float.
  return (
    <nav ref={ref} className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-800 bg-slate-950 pb-[env(safe-area-inset-bottom)]">
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
