import { useState } from "react";
import { Loader2, Moon, Sun, Milk } from "lucide-react";
import type { Entry } from "@/lib/types";
import { findOpenEntry, logFeed, startSleepOrAwake, stopEntry } from "@/lib/activity";
import { fmtDuration, fmtTime } from "@/lib/time";
import { useTick } from "@/hooks/useTick";

const META = {
  sleep: { label: "Sleep", icon: Moon, idle: "bg-indigo-500 text-white", running: "bg-indigo-950 text-indigo-200 ring-2 ring-indigo-400" },
  awake: { label: "Awake", icon: Sun, idle: "bg-amber-400 text-amber-950", running: "bg-amber-950 text-amber-200 ring-2 ring-amber-400" },
} as const;

export function ActivityRibbon({ type, entries }: { type: "sleep" | "awake" | "feed"; entries: Entry[] }) {
  useTick();
  const [busy, setBusy] = useState(false);

  if (type === "feed") return <FeedRibbon busy={busy} setBusy={setBusy} />;

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

// Feed isn't a tracked, ongoing activity like sleep/awake — it's a single
// moment (with an amount). Tapping logs it immediately at the current time;
// amount can be filled in afterward by tapping the entry below.
function FeedRibbon({ busy, setBusy }: { busy: boolean; setBusy: (b: boolean) => void }) {
  async function log(feedType: "formula" | "breastmilk") {
    setBusy(true);
    try {
      await logFeed(feedType);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sticky top-0 z-10 bg-slate-950/95 px-4 pb-3 pt-3 backdrop-blur">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => log("breastmilk")}
          disabled={busy}
          className="flex flex-col items-center gap-1 rounded-2xl bg-emerald-700 py-4 text-emerald-50 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Milk className="h-6 w-6" />}
          <span className="font-semibold">Log Breastmilk</span>
        </button>
        <button
          onClick={() => log("formula")}
          disabled={busy}
          className="flex flex-col items-center gap-1 rounded-2xl bg-emerald-300 py-4 text-emerald-950 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Milk className="h-6 w-6" />}
          <span className="font-semibold">Log Formula</span>
        </button>
      </div>
    </div>
  );
}
