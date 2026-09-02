import { useMemo, useRef, useState } from "react";
import type { Entry, EntryType } from "@/lib/types";
import { ActivityRibbon } from "./ActivityRibbon";
import { EntryList } from "./EntryList";

const PAGES: { type: EntryType; label: string; dot: string }[] = [
  { type: "sleep", label: "Sleep", dot: "bg-indigo-400" },
  { type: "awake", label: "Awake", dot: "bg-amber-400" },
  { type: "feed", label: "Feed", dot: "bg-emerald-400" },
];

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
        className="flex snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: "none", touchAction: "pan-x" }}
      >
        {PAGES.map((p) => (
          <div key={p.type} className="w-full shrink-0 snap-start">
            <ActivityRibbon type={p.type} entries={entries} />
            <EntryList entries={byType[p.type]} onEdit={onEdit} />
          </div>
        ))}
      </div>
    </div>
  );
}
