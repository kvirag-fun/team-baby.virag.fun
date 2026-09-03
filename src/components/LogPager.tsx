import { useEffect, useMemo, useRef, useState } from "react";
import type { Entry, EntryType } from "@/lib/types";
import { ActivityRibbon } from "./ActivityRibbon";
import { EntryList } from "./EntryList";

const PAGES: { type: EntryType; label: string; dot: string }[] = [
  { type: "sleep", label: "Sleep", dot: "bg-indigo-400" },
  { type: "awake", label: "Awake", dot: "bg-amber-400" },
  { type: "feed", label: "Feed", dot: "bg-emerald-400" },
];

const SWIPE_AXIS_THRESHOLD = 8;

export function LogPager({ entries, onEdit }: { entries: Entry[]; onEdit: (e: Entry) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const byType = useMemo(() => {
    const map: Record<EntryType, Entry[]> = { sleep: [], awake: [], feed: [] };
    for (const e of entries) map[e.type].push(e);
    return map;
  }, [entries]);

  function onScroll() {
    const el = containerRef.current;
    if (!el) return;
    setPage(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goTo(i: number) {
    containerRef.current?.scrollTo({ left: i * containerRef.current.clientWidth, behavior: "smooth" });
  }

  // touch-action is pan-y so vertical scrolling of the list below stays fully
  // native. Horizontal swipe is instead driven manually here, and only once a
  // gesture is confidently horizontal (past a small threshold) — so a touch
  // starting on a button (Start/End, an entry row) still scrolls vertically
  // just fine, and only a clear left-right drag pages the pager.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const el: HTMLDivElement = container;

    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let axis: "x" | "y" | null = null;

    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      startX = lastX = t.clientX;
      startY = t.clientY;
      axis = null;
    }

    function onTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      if (axis === null) {
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (Math.abs(dx) < SWIPE_AXIS_THRESHOLD && Math.abs(dy) < SWIPE_AXIS_THRESHOLD) return;
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (axis === "x") {
        e.preventDefault();
        el.scrollLeft -= t.clientX - lastX;
        lastX = t.clientX;
      }
    }

    function onTouchEnd() {
      if (axis === "x") {
        const i = Math.round(el.scrollLeft / el.clientWidth);
        el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
      }
      axis = null;
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div className="flex flex-col">
      <div className="flex justify-center gap-1.5 pb-1 pt-1">
        {PAGES.map((p, i) => (
          <button
            key={p.type}
            onClick={() => goTo(i)}
            aria-label={`Go to ${p.label}`}
            className={`h-1.5 rounded-full transition-all ${page === i ? `w-6 ${p.dot}` : "w-1.5 bg-slate-700"}`}
          />
        ))}
      </div>
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="flex overflow-x-auto"
        style={{ scrollbarWidth: "none", touchAction: "pan-y" }}
      >
        {PAGES.map((p) => (
          <div key={p.type} className="w-full shrink-0">
            <ActivityRibbon type={p.type} entries={entries} />
            <EntryList entries={byType[p.type]} onEdit={onEdit} />
          </div>
        ))}
      </div>
    </div>
  );
}
