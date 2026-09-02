import { useState } from "react";
import { Loader2, Moon, Sun, Milk } from "lucide-react";
import type { Entry } from "@/lib/types";
import { findOpenEntry, startFeed, startSleepOrAwake, stopEntry } from "@/lib/activity";
import { fmtDuration, fmtTime } from "@/lib/time";
import { useTick } from "@/hooks/useTick";

const META = {
  sleep: { label: "Sleep", icon: Moon, idle: "bg-indigo-500 text-white", running: "bg-indigo-950 text-indigo-200 ring-2 ring-indigo-400" },
  awake: { label: "Awake", icon: Sun, idle: "bg-amber-400 text-amber-950", running: "bg-amber-950 text-amber-200 ring-2 ring-amber-400" },
} as const;

export function ActivityRibbon({ type, entries }: { type: "sleep" | "awake" | "feed"; entries: Entry[] }) {
  useTick();
  const [busy, setBusy] = useState(false);

  if (type === "feed") return <FeedRibbon entries={entries} busy={busy} setBusy={setBusy} />;

  const rangeType = type;
  const meta = META[rangeType];
  const open = findOpenEntry(entries, rangeType);
  const Icon = meta.icon;

  async function toggle() {
    setBusy(true);
    try {
      if (open) await stopEntry(open);
      else await startSleepOrAwake(entries, rangeType);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sticky top-0 z-10 bg-slate-950/95 px-4 pb-3 pt-3 backdrop-blur">
      <button
        onClick={toggle}
        disabled={busy}
        className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 transition ${
          open ? meta.running : meta.idle
        } disabled:opacity-60`}
      >
        <span className="flex items-center gap-3">
          <Icon className="h-6 w-6" />
          <span className="text-left">
            <span className="block text-lg font-semibold">{open ? `${meta.label} since ${fmtTime(open.startTime)}` : `Start ${meta.label}`}</span>
            {open && <span className="block text-sm opacity-80">{fmtDuration(open.startTime, null)} so far</span>}
          </span>
        </span>
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : (
          <span className="rounded-full bg-black/20 px-3 py-1 text-sm font-medium">{open ? "End" : "Start"}</span>
        )}
      </button>
    </div>
  );
}

function FeedRibbon({
  entries,
  busy,
  setBusy,
}: {
  entries: Entry[];
  busy: boolean;
  setBusy: (b: boolean) => void;
}) {
  const open = findOpenEntry(entries, "feed");

  async function start(feedType: "formula" | "breastmilk") {
    setBusy(true);
    try {
      await startFeed(feedType);
    } finally {
      setBusy(false);
    }
  }

  async function end() {
    if (!open) return;
    setBusy(true);
    try {
      await stopEntry(open);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sticky top-0 z-10 bg-slate-950/95 px-4 pb-3 pt-3 backdrop-blur">
      {open ? (
        <button
          onClick={end}
          disabled={busy}
          className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 disabled:opacity-60 ${
            open.feedType === "breastmilk" ? "bg-emerald-950 text-emerald-200 ring-2 ring-emerald-600" : "bg-emerald-950 text-emerald-100 ring-2 ring-emerald-300"
          }`}
        >
          <span className="flex items-center gap-3">
            <Milk className="h-6 w-6" />
            <span className="text-left">
              <span className="block text-lg font-semibold">
                {open.feedType === "breastmilk" ? "Breastmilk" : "Formula"} since {fmtTime(open.startTime)}
              </span>
              <span className="block text-sm opacity-80">{fmtDuration(open.startTime, null)} so far</span>
            </span>
          </span>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="rounded-full bg-black/20 px-3 py-1 text-sm font-medium">End</span>}
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => start("breastmilk")}
            disabled={busy}
            className="flex flex-col items-center gap-1 rounded-2xl bg-emerald-700 py-4 text-emerald-50 disabled:opacity-60"
          >
            <Milk className="h-6 w-6" />
            <span className="font-semibold">Start Breastmilk</span>
          </button>
          <button
            onClick={() => start("formula")}
            disabled={busy}
            className="flex flex-col items-center gap-1 rounded-2xl bg-emerald-300 py-4 text-emerald-950 disabled:opacity-60"
          >
            <Milk className="h-6 w-6" />
            <span className="font-semibold">Start Formula</span>
          </button>
        </div>
      )}
    </div>
  );
}
