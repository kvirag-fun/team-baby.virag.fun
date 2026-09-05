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

  // Opaque, and deliberately no backdrop-blur: iOS composites a
  // backdrop-filtered fixed element on its own layer and paints it at a
  // stale offset during rubber-band scrolling, which tore the nav into the
  // middle of the page. At 95% over a slate-950 page the blur was invisible
  // anyway.
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-800 bg-slate-950 pb-[env(safe-area-inset-bottom)]">
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
