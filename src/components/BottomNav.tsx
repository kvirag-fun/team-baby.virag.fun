import { CalendarDays, ListChecks, Plus, BarChart3, Lock } from "lucide-react";

export type Tab = "timeline" | "calendar" | "stats";

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

  // The last slice of the app's viewport-height column, not pinned with
  // `fixed`: `bottom: 0` resolves against the layout viewport, which iOS
  // reports short for a moment after launch, leaving the bar hanging above
  // the screen edge. Sitting at the end of a column whose height is measured
  // (see useViewportHeight) takes that viewport out of the picture.
  //
  // Deliberately no backdrop-blur either: iOS composites a backdrop-filtered
  // element on its own layer and paints it at a stale offset while scrolling,
  // which tore the nav across the middle of the list.
  return (
    <nav className="relative z-20 shrink-0 border-t border-slate-800 bg-slate-950 pb-[env(safe-area-inset-bottom)]">
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
