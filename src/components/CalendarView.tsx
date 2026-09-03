import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Entry } from "@/lib/types";
import { colorFor, labelFor } from "@/lib/colors";
import { fmtTime, startOfDay } from "@/lib/time";

const DAY_MS = 86_400_000;
const HOUR_LABELS = Array.from({ length: 25 }, (_, h) => h);

const isPointType = (t: Entry["type"]) => t === "feed" || t === "supplement";

function dayColumn(entries: Entry[], dayStart: number) {
  const dayEnd = dayStart + DAY_MS;
  const ranges = entries.filter(
    (e) => !isPointType(e.type) && e.startTime < dayEnd && (e.endTime ?? Date.now()) > dayStart,
  );
  const points = entries.filter((e) => isPointType(e.type) && e.startTime >= dayStart && e.startTime < dayEnd);
  return { ranges, points, dayStart, dayEnd };
}

function Column({
  data,
  wide,
  onEdit,
}: {
  data: ReturnType<typeof dayColumn>;
  wide: boolean;
  onEdit: (e: Entry) => void;
}) {
  const pct = (ms: number) => ((ms - data.dayStart) / DAY_MS) * 100;
  return (
    <div className="relative flex-1 border-l border-slate-800" style={{ minWidth: wide ? 220 : 40 }}>
      {HOUR_LABELS.map((h) => (
        <div key={h} className="absolute inset-x-0 border-t border-slate-900" style={{ top: `${(h / 24) * 100}%` }} />
      ))}
      {data.ranges.map((e) => {
        const top = Math.max(0, pct(e.startTime));
        const bottom = Math.min(100, pct(e.endTime ?? Date.now()));
        const c = colorFor(e);
        return (
          <button
            key={e.id}
            onClick={() => onEdit(e)}
            className={`absolute inset-x-0.5 rounded ${c.bg} ${c.text} overflow-hidden px-1 text-left text-[10px] leading-tight opacity-90`}
            style={{ top: `${top}%`, height: `${Math.max(bottom - top, 0.6)}%` }}
          >
            {wide && bottom - top > 3 ? `${labelFor(e)} ${fmtTime(e.startTime)}` : ""}
          </button>
        );
      })}
      {data.points.map((e) => {
        const c = colorFor(e);
        return (
          <button
            key={e.id}
            onClick={() => onEdit(e)}
            className={`absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full ${c.bg} ring-2 ring-slate-950`}
            style={{ top: `${pct(e.startTime)}%` }}
            title={`${labelFor(e)} ${fmtTime(e.startTime)}`}
          />
        );
      })}
    </div>
  );
}

export function CalendarView({ entries, onEdit }: { entries: Entry[]; onEdit: (e: Entry) => void }) {
  const [mode, setMode] = useState<"day" | "week">("day");
  const [anchor, setAnchor] = useState(() => startOfDay(Date.now()));

  const days = useMemo(() => {
    if (mode === "day") return [anchor];
    const weekStart = anchor - ((new Date(anchor).getDay() + 6) % 7) * DAY_MS; // Monday start
    return Array.from({ length: 7 }, (_, i) => weekStart + i * DAY_MS);
  }, [mode, anchor]);

  const step = mode === "day" ? DAY_MS : DAY_MS * 7;

  return (
    <div className="flex flex-col px-4 pb-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex overflow-hidden rounded-lg border border-slate-700">
          {(["day", "week"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-sm capitalize ${mode === m ? "bg-slate-700 text-white" : "text-slate-400"}`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setAnchor((a) => a - step)} aria-label="Previous">
            <ChevronLeft className="h-5 w-5 text-slate-400" />
          </button>
          <span className="min-w-24 text-center text-sm text-slate-300">
            {new Date(anchor).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
          <button onClick={() => setAnchor((a) => a + step)} aria-label="Next">
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto rounded-xl bg-slate-900/50">
        <div className="flex w-8 shrink-0 flex-col text-right">
          {HOUR_LABELS.filter((h) => h % 3 === 0).map((h) => (
            <div key={h} className="relative h-[calc(100%/8)] text-[10px] text-slate-500" style={{ height: 720 / 8 }}>
              <span className="absolute -top-1.5 right-1">{h}:00</span>
            </div>
          ))}
        </div>
        <div className="flex flex-1" style={{ height: 720 }}>
          {days.map((d) => (
            <Column key={d} data={dayColumn(entries, d)} wide={mode === "day"} onEdit={onEdit} />
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
        <Legend color="bg-indigo-400" label="Nap" />
        <Legend color="bg-indigo-800" label="Overnight" />
        <Legend color="bg-amber-400" label="Awake" />
        <Legend color="bg-emerald-300" label="Formula" />
        <Legend color="bg-emerald-700" label="Breastmilk" />
        <Legend color="bg-red-300" label="Vitamin D" />
        <Legend color="bg-red-800" label="Iron" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
