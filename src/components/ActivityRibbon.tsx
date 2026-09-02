import { useState } from "react";
import { Loader2, Moon, Sun, Milk, type LucideIcon } from "lucide-react";
import type { Entry } from "@/lib/types";
import { findOpenEntry, logFeed, startAwake, startSleep, stopEntry } from "@/lib/activity";
import { fmtDuration, fmtTime } from "@/lib/time";
import { useTick } from "@/hooks/useTick";

/** The compact icon-over-label button shared by every idle quick-start action. */
function QuickButton({
  icon: Icon,
  label,
  bg,
  text,
  busy,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  bg: string;
  text: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`flex w-full flex-col items-center justify-center gap-1 rounded-2xl py-4 ${bg} ${text} disabled:opacity-60`}
    >
      {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Icon className="h-6 w-6" />}
      <span className="font-semibold">{label}</span>
    </button>
  );
}

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
      {open ? (
        <button
          onClick={toggle}
          disabled={busy}
          className="flex w-full items-center justify-between rounded-2xl bg-amber-950 px-5 py-4 text-amber-200 ring-2 ring-amber-400 disabled:opacity-60"
        >
          <span className="flex items-center gap-3">
            <Sun className="h-6 w-6" />
            <span className="text-left">
              <span className="block text-lg font-semibold">Awake since {fmtTime(open.startTime)}</span>
              <span className="block text-sm opacity-80">{fmtDuration(open.startTime, null)} so far</span>
            </span>
          </span>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="rounded-full bg-black/20 px-3 py-1 text-sm font-medium">End</span>}
        </button>
      ) : (
        <QuickButton icon={Sun} label="Awake" bg="bg-amber-400" text="text-amber-950" busy={busy} onClick={toggle} />
      )}
    </div>
  );
}

// Overnight is offered as a quick-start option in the evening/night window
// (18:00–05:59); outside that window only Nap makes sense as a choice.
function isOvernightAvailable() {
  const h = new Date().getHours();
  return h >= 18 || h < 6;
}

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
  const overnightAvailable = isOvernightAvailable();

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
          <QuickButton icon={Moon} label="Nap" bg="bg-indigo-400" text="text-indigo-950" busy={busy} onClick={() => start("nap")} />
          <QuickButton icon={Moon} label="Overnight" bg="bg-indigo-800" text="text-indigo-50" busy={busy} onClick={() => start("overnight")} />
        </div>
      ) : (
        <QuickButton icon={Moon} label="Nap" bg="bg-indigo-400" text="text-indigo-950" busy={busy} onClick={() => start("nap")} />
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
        <QuickButton icon={Milk} label="Log Breastmilk" bg="bg-emerald-700" text="text-emerald-50" busy={busy} onClick={() => log("breastmilk")} />
        <QuickButton icon={Milk} label="Log Formula" bg="bg-emerald-300" text="text-emerald-950" busy={busy} onClick={() => log("formula")} />
      </div>
    </div>
  );
}
