import { useState } from "react";
import { Loader2, Moon, Sun, Milk } from "lucide-react";
import type { Entry } from "@/lib/types";
import { findOpenEntry, logFeed, startAwake, startSleep, stopEntry } from "@/lib/activity";
import { fmtDuration, fmtTime } from "@/lib/time";
import { useTick } from "@/hooks/useTick";

export function ActivityRibbon({ type, entries }: { type: "sleep" | "awake" | "feed"; entries: Entry[] }) {
  useTick();
  const [busy, setBusy] = useState(false);

  if (type === "sleep") return <SleepRibbon entries={entries} busy={busy} setBusy={setBusy} />;
  if (type === "feed") return <FeedRibbon busy={busy} setBusy={setBusy} />;

  const open = findOpenEntry(entries, "awake");

  async function toggle() {
    setBusy(true);
    try {
      if (open) await stopEntry(open);
      else await startAwake(entries);
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
          open ? "bg-amber-950 text-amber-200 ring-2 ring-amber-400" : "bg-amber-400 text-amber-950"
        } disabled:opacity-60`}
      >
        <span className="flex items-center gap-3">
          <Sun className="h-6 w-6" />
          <span className="text-left">
            <span className="block text-lg font-semibold">
              {open ? `Awake since ${fmtTime(open.startTime)}` : "Start Awake"}
            </span>
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

// Overnight is only offered as a quick-start option from 18:00 onward —
// before then it doesn't make sense as a choice, so only Nap is shown.
const OVERNIGHT_AVAILABLE_HOUR = 18;

function SleepRibbon({
  entries,
  busy,
  setBusy,
}: {
  entries: Entry[];
  busy: boolean;
  setBusy: (b: boolean) => void;
}) {
  const open = findOpenEntry(entries, "sleep");
  const overnightAvailable = new Date().getHours() >= OVERNIGHT_AVAILABLE_HOUR;

  async function start(sleepType: "nap" | "overnight") {
    setBusy(true);
    try {
      await startSleep(entries, sleepType);
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

  if (open) {
    const isOvernight = open.sleepType === "overnight";
    return (
      <div className="sticky top-0 z-10 bg-slate-950/95 px-4 pb-3 pt-3 backdrop-blur">
        <button
          onClick={end}
          disabled={busy}
          className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 disabled:opacity-60 ${
            isOvernight
              ? "bg-indigo-950 text-indigo-200 ring-2 ring-indigo-700"
              : "bg-indigo-950 text-indigo-200 ring-2 ring-indigo-400"
          }`}
        >
          <span className="flex items-center gap-3">
            <Moon className="h-6 w-6" />
            <span className="text-left">
              <span className="block text-lg font-semibold">
                {isOvernight ? "Overnight" : "Nap"} since {fmtTime(open.startTime)}
              </span>
              <span className="block text-sm opacity-80">{fmtDuration(open.startTime, null)} so far</span>
            </span>
          </span>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="rounded-full bg-black/20 px-3 py-1 text-sm font-medium">End</span>}
        </button>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-10 bg-slate-950/95 px-4 pb-3 pt-3 backdrop-blur">
      {overnightAvailable ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => start("nap")}
            disabled={busy}
            className="flex flex-col items-center gap-1 rounded-2xl bg-indigo-400 py-4 text-indigo-950 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Moon className="h-6 w-6" />}
            <span className="font-semibold">Start Nap</span>
          </button>
          <button
            onClick={() => start("overnight")}
            disabled={busy}
            className="flex flex-col items-center gap-1 rounded-2xl bg-indigo-800 py-4 text-indigo-50 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Moon className="h-6 w-6" />}
            <span className="font-semibold">Start Overnight</span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => start("nap")}
          disabled={busy}
          className="flex w-full items-center justify-between rounded-2xl bg-indigo-400 px-5 py-4 text-indigo-950 disabled:opacity-60"
        >
          <span className="flex items-center gap-3">
            <Moon className="h-6 w-6" />
            <span className="text-lg font-semibold">Start Nap</span>
          </span>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="rounded-full bg-black/20 px-3 py-1 text-sm font-medium">Start</span>}
        </button>
      )}
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
