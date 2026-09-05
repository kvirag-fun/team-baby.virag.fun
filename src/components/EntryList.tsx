import { useMemo } from "react";
import { Moon, MoonStar, Sun, Pill } from "lucide-react";
import { isPointType, type Entry } from "@/lib/types";
import { colorFor, labelFor } from "@/lib/colors";
import { fmtDayHeading, fmtDuration, fmtTime, startOfDay } from "@/lib/time";
import { Diaper, Poop } from "./DiaperIcon";
import { BabyBottle, Breast } from "./FeedIcons";
import { BabyFace, Butt, HairWash } from "./BathIcons";

// Vitamin D and iron share an icon and are told apart by colour. Sleep, feed
// and diaper each give their sub-types their own, since nap/overnight,
// breast/bottle and wet/poopy are visibly different things.
function iconFor(entry: Entry) {
  if (entry.type === "sleep") return entry.sleepType === "overnight" ? MoonStar : Moon;
  if (entry.type === "awake") return Sun;
  if (entry.type === "supplement") return Pill;
  if (entry.type === "diaper") return entry.diaperType === "poopy" ? Poop : Diaper;
  if (entry.type === "bath") {
    if (entry.bathType === "butt") return Butt;
    return entry.bathType === "hairWash" ? HairWash : BabyFace;
  }
  return entry.feedType === "formula" ? BabyBottle : Breast;
}

export function EntryList({
  entries,
  onEdit,
  hasOlder = false,
}: {
  entries: Entry[];
  onEdit: (e: Entry) => void;
  /** Whether entries exist beyond the pages' three-day window, in which case
   * the list says where they went rather than just ending. */
  hasOlder?: boolean;
}) {
  const groups = useMemo(() => {
    const map = new Map<number, Entry[]>();
    for (const e of entries) {
      const day = startOfDay(e.startTime);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(e);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [entries]);

  const older = hasOlder ? (
    <p className="px-4 pb-2 pt-1 text-center text-xs text-slate-600">Older entries are in the calendar</p>
  ) : null;

  if (groups.length === 0) {
    return (
      <>
        <p className="px-4 py-8 text-center text-sm text-slate-500">
          {hasOlder ? "Nothing in the last three days." : "Nothing logged yet."}
        </p>
        {older}
      </>
    );
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
              const isPoint = isPointType(entry.type);
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
      {older}
    </div>
  );
}
