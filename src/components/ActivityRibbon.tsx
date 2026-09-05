import { useState } from "react";
import { Baby, Loader2, Moon, MoonStar, Sun, Pill, X, type LucideIcon } from "lucide-react";
import type { Entry } from "@/lib/types";
import { Diaper, Poop } from "./DiaperIcon";
import { Butt } from "./BathIcons";
import { BabyHairless } from "./BabyIcon";
import { BabyBottle, Breast } from "./FeedIcons";
import { findOpenEntry, logBath, logDiaper, logFeed, logSupplement, startAwake, startSleep, stopEntry } from "@/lib/activity";
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

export function ActivityRibbon({
  type,
  entries,
}: {
  type: "sleep" | "feed" | "supplement" | "diaper" | "bath";
  entries: Entry[];
}) {
  useTick();
  const [busy, setBusy] = useState(false);

  if (type === "feed") return <FeedRibbon busy={busy} setBusy={setBusy} />;
  if (type === "supplement") return <SupplementRibbon busy={busy} setBusy={setBusy} />;
  if (type === "diaper") return <DiaperRibbon busy={busy} setBusy={setBusy} />;
  if (type === "bath") return <BathRibbon busy={busy} setBusy={setBusy} />;
  return <SleepAwakeRibbon entries={entries} busy={busy} setBusy={setBusy} />;
}

// Overnight is only offered as a quick-start in the evening/night window
// (18:00–05:59); outside it, only Nap makes sense as a thing to start now.
// The entry sheet still offers all three at any hour, for logging one after
// the fact.
function isOvernightAvailable() {
  const h = new Date().getHours();
  return h >= 18 || h < 6;
}

// Nap, overnight and awake are three alternatives of one thing — the baby is
// always in exactly one of them — so they share a page and a ribbon rather
// than being split across two. Starting any one of them closes whichever was
// running, which is what makes them alternatives rather than independent
// timers (see startSleep/startAwake).
function SleepAwakeRibbon({
  entries,
  busy,
  setBusy,
}: {
  entries: Entry[];
  busy: boolean;
  setBusy: (b: boolean) => void;
}) {
  const open = findOpenEntry(entries, "sleep") ?? findOpenEntry(entries, "awake");

  async function start(kind: "nap" | "overnight" | "awake") {
    setBusy(true);
    try {
      if (kind === "awake") await startAwake(entries);
      else await startSleep(entries, kind);
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
    const isAwake = open.type === "awake";
    const isOvernight = open.sleepType === "overnight";
    const Icon = isAwake ? Sun : isOvernight ? MoonStar : Moon;
    const label = isAwake ? "Awake" : isOvernight ? "Overnight" : "Nap";
    return (
      <div className="sticky top-0 z-10 bg-slate-950 px-4 pb-3 pt-3">
        <button
          onClick={end}
          disabled={busy}
          className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 disabled:opacity-60 ${
            isAwake
              ? "bg-amber-950 text-amber-200 ring-2 ring-amber-400"
              : isOvernight
                ? "bg-indigo-950 text-indigo-200 ring-2 ring-indigo-700"
                : "bg-indigo-950 text-indigo-200 ring-2 ring-indigo-400"
          }`}
        >
          <span className="flex items-center gap-3">
            <Icon className="h-6 w-6" />
            <span className="text-left">
              <span className="block text-lg font-semibold">
                {label} since {fmtTime(open.startTime)}
              </span>
              <span className="block text-sm opacity-80">{fmtDuration(open.startTime, null)} so far</span>
            </span>
          </span>
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span className="rounded-full bg-black/20 px-3 py-1 text-sm font-medium">End</span>
          )}
        </button>
      </div>
    );
  }

  const overnight = isOvernightAvailable();
  return (
    <div className="sticky top-0 z-10 bg-slate-950 px-4 pb-3 pt-3">
      <div className={`grid gap-2 ${overnight ? "grid-cols-3" : "grid-cols-2"}`}>
        <QuickButton icon={Moon} label="Nap" bg="bg-indigo-400" text="text-indigo-950" busy={busy} onClick={() => start("nap")} />
        {overnight && (
          <QuickButton icon={MoonStar} label="Overnight" bg="bg-indigo-800" text="text-indigo-50" busy={busy} onClick={() => start("overnight")} />
        )}
        <QuickButton icon={Sun} label="Awake" bg="bg-amber-400" text="text-amber-950" busy={busy} onClick={() => start("awake")} />
      </div>
    </div>
  );
}

// Feed isn't a tracked, ongoing activity like sleep/awake — it's a single
// moment (with an amount). Tapping logs it immediately at the current time;
// amount can be filled in afterward by tapping the entry below.
//
// Feed is the exception: neither button logs straight away, because which
// breast, and what was in the bottle, are worth knowing and can't be
// reconstructed afterwards. The follow-up replaces the two buttons in place
// rather than opening a sheet, so either way it stays two taps.
function FeedRibbon({ busy, setBusy }: { busy: boolean; setBusy: (b: boolean) => void }) {
  const [asking, setAsking] = useState<"boob" | "bottle" | null>(null);

  async function log(
    feedType: "formula" | "breastmilk",
    details: { feedSide?: "left" | "right"; bottleContent?: "breastmilk" | "formula" },
  ) {
    setBusy(true);
    try {
      await logFeed(feedType, details);
      setAsking(null);
    } finally {
      setBusy(false);
    }
  }

  if (asking) {
    const [a, b] =
      asking === "boob"
        ? ([
            { label: "Left", onClick: () => log("breastmilk", { feedSide: "left" }) },
            { label: "Right", onClick: () => log("breastmilk", { feedSide: "right" }) },
          ] as const)
        : ([
            { label: "Breastmilk", onClick: () => log("formula", { bottleContent: "breastmilk" }) },
            { label: "Formula", onClick: () => log("formula", { bottleContent: "formula" }) },
          ] as const);
    const icon = asking === "boob" ? Breast : BabyBottle;
    const bg = asking === "boob" ? "bg-emerald-700" : "bg-emerald-300";
    const text = asking === "boob" ? "text-emerald-50" : "text-emerald-950";

    return (
      <div className="sticky top-0 z-10 bg-slate-950 px-4 pb-3 pt-3">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <QuickButton icon={icon} label={a.label} bg={bg} text={text} busy={busy} onClick={a.onClick} />
          <QuickButton icon={icon} label={b.label} bg={bg} text={text} busy={busy} onClick={b.onClick} />
          <button
            onClick={() => setAsking(null)}
            disabled={busy}
            aria-label="Cancel"
            className="flex w-12 items-center justify-center rounded-2xl border border-slate-700 text-slate-400 disabled:opacity-60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-10 bg-slate-950 px-4 pb-3 pt-3">
      <div className="grid grid-cols-2 gap-2">
        <QuickButton icon={Breast} label="Boob" bg="bg-emerald-700" text="text-emerald-50" busy={busy} onClick={() => setAsking("boob")} />
        <QuickButton icon={BabyBottle} label="Bottle" bg="bg-emerald-300" text="text-emerald-950" busy={busy} onClick={() => setAsking("bottle")} />
      </div>
    </div>
  );
}

// Supplements are single moments too, same as feed — no start/end tracking.
function SupplementRibbon({ busy, setBusy }: { busy: boolean; setBusy: (b: boolean) => void }) {
  async function log(supplementType: "vitaminD" | "iron") {
    setBusy(true);
    try {
      await logSupplement(supplementType);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sticky top-0 z-10 bg-slate-950 px-4 pb-3 pt-3">
      <div className="grid grid-cols-2 gap-2">
        <QuickButton icon={Pill} label="Vitamin D" bg="bg-red-300" text="text-red-950" busy={busy} onClick={() => log("vitaminD")} />
        <QuickButton icon={Pill} label="Iron" bg="bg-red-800" text="text-red-50" busy={busy} onClick={() => log("iron")} />
      </div>
    </div>
  );
}

// Diaper changes are single moments too — tap to log one at the current time.
function DiaperRibbon({ busy, setBusy }: { busy: boolean; setBusy: (b: boolean) => void }) {
  async function log(diaperType: "wet" | "poopy") {
    setBusy(true);
    try {
      await logDiaper(diaperType);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sticky top-0 z-10 bg-slate-950 px-4 pb-3 pt-3">
      <div className="grid grid-cols-2 gap-2">
        <QuickButton icon={Diaper} label="Wet" bg="bg-sky-300" text="text-sky-950" busy={busy} onClick={() => log("wet")} />
        <QuickButton icon={Poop} label="Poopy" bg="bg-amber-700" text="text-amber-50" busy={busy} onClick={() => log("poopy")} />
      </div>
    </div>
  );
}

// Washing is a single moment too. Three alternatives rather than two, so the
// buttons go three across like the sleep ribbon's.
function BathRibbon({ busy, setBusy }: { busy: boolean; setBusy: (b: boolean) => void }) {
  async function log(bathType: "bath" | "butt" | "hairWash") {
    setBusy(true);
    try {
      await logBath(bathType);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sticky top-0 z-10 bg-slate-950 px-4 pb-3 pt-3">
      <div className="grid grid-cols-3 gap-2">
        <QuickButton icon={Butt} label="Butt" bg="bg-fuchsia-500" text="text-fuchsia-50" busy={busy} onClick={() => log("butt")} />
        <QuickButton icon={BabyHairless} label="Body" bg="bg-fuchsia-300" text="text-fuchsia-950" busy={busy} onClick={() => log("bath")} />
        <QuickButton icon={Baby} label="Hair" bg="bg-fuchsia-800" text="text-fuchsia-50" busy={busy} onClick={() => log("hairWash")} />
      </div>
    </div>
  );
}
