import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Entry } from "@/lib/types";
import { startOfDay } from "@/lib/time";

const DAY_MS = 86_400_000;

type Period = "week" | "month";

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
      let feeds = 0;
      for (const e of entries) {
        if (e.type === "sleep") sleep += overlapHours(e, dayStart);
        else if (e.type === "awake") awake += overlapHours(e, dayStart);
        else if (e.startTime >= dayStart && e.startTime < dayStart + DAY_MS) feeds += 1;
      }
      return {
        label: new Date(dayStart).toLocaleDateString(undefined, { weekday: "short", day: "numeric" }),
        sleep: Math.round(sleep * 10) / 10,
        awake: Math.round(awake * 10) / 10,
        feeds,
      };
    });
  }, [entries, period]);

  const totals = useMemo(
    () => ({
      sleep: data.reduce((s, d) => s + d.sleep, 0),
      awake: data.reduce((s, d) => s + d.awake, 0),
      feeds: data.reduce((s, d) => s + d.feeds, 0),
    }),
    [data],
  );

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

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Sleep" value={`${totals.sleep.toFixed(1)}h`} color="text-indigo-300" />
        <Stat label="Awake" value={`${totals.awake.toFixed(1)}h`} color="text-amber-300" />
        <Stat label="Feeds" value={String(totals.feeds)} color="text-emerald-300" />
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
              <Bar dataKey="sleep" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
              <Bar dataKey="awake" stackId="a" fill="#fbbf24" radius={[4, 4, 0, 0]} />
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
              <Bar dataKey="feeds" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-slate-900 p-3 text-center">
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
