import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Entry } from "@/lib/types";
import { startOfDay } from "@/lib/time";

const DAY_MS = 86_400_000;

type Period = "week" | "month";

// Every chart stacks two sub-types of one activity in two shades of the same
// hue, so a key is the only thing saying which shade is which.
const LEGEND_PROPS = {
  verticalAlign: "top" as const,
  align: "right" as const,
  height: 20,
  iconSize: 8,
  wrapperStyle: { fontSize: 11, color: "#94a3b8" },
};

function rangeStart(period: Period) {
  const today = startOfDay(Date.now());
  return period === "week" ? today - 6 * DAY_MS : today - 29 * DAY_MS;
}

function overlapHours(entry: Entry, dayStart: number) {
  const dayEnd = dayStart + DAY_MS;
  const start = Math.max(entry.startTime, dayStart);
  const end = Math.min(entry.endTime ?? Date.now(), dayEnd);
  return Math.max(0, end - start) / 3_600_000;
}

export function StatsView({ entries }: { entries: Entry[] }) {
  const [period, setPeriod] = useState<Period>("week");

  const data = useMemo(() => {
    const from = rangeStart(period);
    const days = Math.round((startOfDay(Date.now()) - from) / DAY_MS) + 1;
    return Array.from({ length: days }, (_, i) => {
      const dayStart = from + i * DAY_MS;
      let sleep = 0;
      let awake = 0;
      let breastmilk = 0;
      let formula = 0;
      let vitaminD = 0;
      let iron = 0;
      let wet = 0;
      let poopy = 0;
      let baths = 0;
      for (const e of entries) {
        if (e.type === "sleep") sleep += overlapHours(e, dayStart);
        else if (e.type === "awake") awake += overlapHours(e, dayStart);
        else if (e.startTime >= dayStart && e.startTime < dayStart + DAY_MS) {
          if (e.type === "feed") {
            if (e.feedType === "formula") formula += 1;
            else breastmilk += 1;
          } else if (e.type === "supplement") {
            if (e.supplementType === "iron") iron += 1;
            else vitaminD += 1;
          } else if (e.type === "diaper") {
            if (e.diaperType === "poopy") poopy += 1;
            else wet += 1;
          } else if (e.type === "bath") baths += 1;
        }
      }
      return {
        label: new Date(dayStart).toLocaleDateString(undefined, { weekday: "short", day: "numeric" }),
        sleep: Math.round(sleep * 10) / 10,
        awake: Math.round(awake * 10) / 10,
        breastmilk,
        formula,
        vitaminD,
        iron,
        wet,
        poopy,
        baths,
      };
    });
  }, [entries, period]);

  const totals = useMemo(() => {
    const sum = (key: keyof (typeof data)[number]) => data.reduce((s, d) => s + (d[key] as number), 0);
    return {
      sleep: sum("sleep"),
      awake: sum("awake"),
      breastmilk: sum("breastmilk"),
      formula: sum("formula"),
      vitaminD: sum("vitaminD"),
      iron: sum("iron"),
      wet: sum("wet"),
      poopy: sum("poopy"),
      baths: sum("baths"),
    };
  }, [data]);

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div className="flex overflow-hidden self-start rounded-lg border border-slate-700">
        {(["week", "month"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 text-sm capitalize ${period === p ? "bg-slate-700 text-white" : "text-slate-400"}`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Three across: a phone can't fit more without clipping the longer
          single-word labels. */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Sleep" value={`${totals.sleep.toFixed(1)}h`} color="text-indigo-300" />
        <Stat label="Awake" value={`${totals.awake.toFixed(1)}h`} color="text-amber-300" />
        <Stat label="Boob" value={String(totals.breastmilk)} color="text-emerald-500" />
        <Stat label="Bottle" value={String(totals.formula)} color="text-emerald-300" />
        <Stat label="Wet" value={String(totals.wet)} color="text-sky-300" />
        <Stat label="Poopy" value={String(totals.poopy)} color="text-amber-600" />
        <Stat label="Vitamin D" value={String(totals.vitaminD)} color="text-red-300" />
        <Stat label="Iron" value={String(totals.iron)} color="text-red-500" />
        <Stat label="Baths" value={String(totals.baths)} color="text-fuchsia-400" />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-400">Sleep vs awake (hours/day)</h3>
        <div className="h-52 w-full">
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} interval={period === "month" ? 4 : 0} />
              <YAxis stroke="#64748b" fontSize={11} width={28} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 12 }} />
              <Legend {...LEGEND_PROPS} />
              <Bar dataKey="sleep" name="Sleep" stackId="a" fill="#6366f1" />
              <Bar dataKey="awake" name="Awake" stackId="a" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-400">Feeds per day</h3>
        <div className="h-40 w-full">
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} interval={period === "month" ? 4 : 0} />
              <YAxis stroke="#64748b" fontSize={11} width={28} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 12 }} />
              <Legend {...LEGEND_PROPS} />
              <Bar dataKey="breastmilk" name="Boob" stackId="f" fill="#047857" />
              <Bar dataKey="formula" name="Bottle" stackId="f" fill="#6ee7b7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-400">Diapers per day</h3>
        <div className="h-40 w-full">
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} interval={period === "month" ? 4 : 0} />
              <YAxis stroke="#64748b" fontSize={11} width={28} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 12 }} />
              <Legend {...LEGEND_PROPS} />
              <Bar dataKey="wet" name="Wet" stackId="d" fill="#7dd3fc" />
              <Bar dataKey="poopy" name="Poopy" stackId="d" fill="#b45309" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        {/* One series, so no key needed — the other charts stack two shades
            of a hue and can't be read without one. */}
        <h3 className="mb-2 text-sm font-medium text-slate-400">Baths per day</h3>
        <div className="h-40 w-full">
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} interval={period === "month" ? 4 : 0} />
              <YAxis stroke="#64748b" fontSize={11} width={28} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 12 }} />
              <Bar dataKey="baths" name="Baths" fill="#d946ef" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-400">Supplements per day</h3>
        <div className="h-40 w-full">
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} interval={period === "month" ? 4 : 0} />
              <YAxis stroke="#64748b" fontSize={11} width={28} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 12 }} />
              <Legend {...LEGEND_PROPS} />
              <Bar dataKey="vitaminD" name="Vitamin D" stackId="s" fill="#fca5a5" />
              <Bar dataKey="iron" name="Iron" stackId="s" fill="#991b1b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-slate-900 px-3 py-2 text-center">
      <div className={`text-base font-semibold leading-tight ${color}`}>{value}</div>
      <div className="text-xs leading-tight text-slate-500">{label}</div>
    </div>
  );
}
