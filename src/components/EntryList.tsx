import { useMemo } from "react";
import { Moon, MoonStar, Sun, Milk, Pill } from "lucide-react";
import type { Entry } from "@/lib/types";
import { colorFor, labelFor } from "@/lib/colors";
import { fmtDayHeading, fmtDuration, fmtTime, startOfDay } from "@/lib/time";

function iconFor(entry: Entry) {
  if (entry.type === "sleep") return entry.sleepType === "overnight" ? MoonStar : Moon;
  if (entry.type === "awake") return Sun;
  if (entry.type === "supplement") return Pill;
  return Milk;
}

export function EntryList({ entries, onEdit }: { entries: Entry[]; onEdit: (e: Entry) => void }) {
  const groups = useMemo(() => {
    const map = new Map<number, Entry[]>();
    for (const e of entries) {
      const day = startOfDay(e.startTime);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(e);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [entries]);

  if (groups.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-slate-500">Nothing logged yet.</p>;
  }

  return (
    <div className="pb-4">
      {groups.map(([day, dayEntries]) => (
        <div key={day} className="mb-4">
          <h2 className="px-4 pb-2 text-sm font-medium text-slate-400">{fmtDayHeading(day)}</h2>
          <ul className="flex flex-col gap-2 px-4">
            {dayEntries.map((entry) => {
              const c = colorFor(entry);
              const Icon = iconFor(entry);
              const isPoint = entry.type === "feed" || entry.type === "supplement";
              return (
                <li key={entry.id}>
                  <button
                    onClick={() => onEdit(entry)}
                    className="flex w-full items-center gap-3 rounded-xl bg-slate-900 p-3 text-left"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${c.bg}`}>
                      <Icon className={`h-4.5 w-4.5 ${c.text}`} />
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{labelFor(entry)}</span>
                        {entry.amount != null && (
                          <span className="text-sm text-slate-400">
                            {entry.amount}
                            {entry.amountUnit}
                          </span>
                        )}
                      </span>
                      <span className="text-sm text-slate-400">
                        {isPoint ? (
                          fmtTime(entry.startTime)
                        ) : (
                          <>
                            {fmtTime(entry.startTime)} – {entry.endTime ? fmtTime(entry.endTime) : "now"} ·{" "}
                            {fmtDuration(entry.startTime, entry.endTime)}
                          </>
                        )}
                      </span>
                    </span>
                    {!isPoint && !entry.endTime && (
                      <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                        ongoing
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
