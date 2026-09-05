import { useState } from "react";
import { SunMoon, Pill, Trash2, X } from "lucide-react";
import { Diaper } from "./DiaperIcon";
import { BabyBottle } from "./FeedIcons";
import {
  isPointType,
  type AmountUnit,
  type DiaperType,
  type Entry,
  type EntryType,
  type FeedType,
  type NewEntry,
  type SleepType,
  type SupplementType,
} from "@/lib/types";
import { toInputValue, fromInputValue } from "@/lib/time";
import { useSheetScrollLock } from "@/hooks/useSheetScrollLock";

// Nap, overnight and awake are three alternatives of one kind rather than
// separate kinds, so they share a single button here and are chosen between
// below — matching how the log page presents them. Its icon is a moon and a
// sun in one, since it covers both.
type Kind = "sleep" | "feed" | "diaper" | "supplement";
type SleepKind = SleepType | "awake";

const TYPE_OPTIONS: { key: Kind; label: string; icon: typeof SunMoon; active: string }[] = [
  { key: "sleep", label: "Sleep / Awake", icon: SunMoon, active: "bg-indigo-500 text-white" },
  { key: "feed", label: "Feed", icon: BabyBottle, active: "bg-emerald-500 text-white" },
  { key: "diaper", label: "Diaper", icon: Diaper, active: "bg-sky-500 text-white" },
  { key: "supplement", label: "Supplement", icon: Pill, active: "bg-red-500 text-white" },
];

const SLEEP_KINDS: { key: SleepKind; label: string; active: string }[] = [
  { key: "nap", label: "Nap", active: "bg-indigo-400 text-indigo-950" },
  { key: "overnight", label: "Overnight", active: "bg-indigo-800 text-indigo-50" },
  { key: "awake", label: "Awake", active: "bg-amber-400 text-amber-950" },
];

/** Awake is its own entry type in the data, so the picker's three-way choice
 * has to fold back into a type plus a sleepType on save. */
function entryTypeFor(kind: Kind, sleepKind: SleepKind): EntryType {
  if (kind !== "sleep") return kind;
  return sleepKind === "awake" ? "awake" : "sleep";
}

export function EntrySheet({
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  initial: Entry | null;
  onClose: () => void;
  onSave: (entry: NewEntry) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [kind, setKind] = useState<Kind>(initial && initial.type !== "awake" ? initial.type : "sleep");
  const [sleepKind, setSleepKind] = useState<SleepKind>(
    initial?.type === "awake" ? "awake" : (initial?.sleepType ?? "nap"),
  );
  const type = entryTypeFor(kind, sleepKind);
  const [start, setStart] = useState(toInputValue(initial?.startTime ?? Date.now()));
  const [ongoing, setOngoing] = useState(initial ? initial.endTime == null : false);
  const [end, setEnd] = useState(toInputValue(initial?.endTime ?? Date.now()));
  const [feedType, setFeedType] = useState<FeedType>(initial?.feedType ?? "breastmilk");
  const [supplementType, setSupplementType] = useState<SupplementType>(initial?.supplementType ?? "vitaminD");
  const [diaperType, setDiaperType] = useState<DiaperType>(initial?.diaperType ?? "wet");
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : "");
  const [unit, setUnit] = useState<AmountUnit>(initial?.amountUnit ?? "ml");
  const [note, setNote] = useState(initial?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const panelRef = useSheetScrollLock<HTMLDivElement>();

  async function save() {
    setBusy(true);
    try {
      const startTime = fromInputValue(start);
      const isPoint = isPointType(type);
      const entry: NewEntry = {
        type,
        startTime,
        endTime: isPoint ? null : ongoing ? null : fromInputValue(end),
        feedType: type === "feed" ? feedType : null,
        sleepType: type === "sleep" ? (sleepKind as SleepType) : null,
        supplementType: type === "supplement" ? supplementType : null,
        diaperType: type === "diaper" ? diaperType : null,
        amount: type === "feed" && amount !== "" ? Number(amount) : null,
        amountUnit: type === "feed" ? unit : null,
        note,
      };
      await onSave(entry);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function confirmedDelete() {
    if (!initial || !onDelete) return;
    setBusy(true);
    try {
      await onDelete(initial.id);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/60" onClick={onClose}>
      <div
        ref={panelRef}
        className="max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-2xl bg-slate-950 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <div className="flex items-center justify-between px-4 pt-4">
            <h2 className="text-lg font-semibold">{initial ? "Edit entry" : "New entry"}</h2>
            <button onClick={onClose} aria-label="Close" disabled={confirmDelete}>
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>

          <div className="flex flex-col gap-4 p-4">
          {/* Two across: four kinds, and "Sleep / Awake" and "Supplement"
              both need more width than a narrower column gives them. */}
          <div className="grid grid-cols-2 gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setKind(opt.key)}
                className={`flex flex-col items-center gap-1 rounded-xl border py-3 ${
                  kind === opt.key ? `border-transparent ${opt.active}` : "border-slate-700 text-slate-400"
                }`}
              >
                <opt.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1 text-sm text-slate-400">
            {isPointType(type) ? "Time" : "Start"}
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>

          {!isPointType(type) && (
            <>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={ongoing}
                  onChange={(e) => setOngoing(e.target.checked)}
                  className="h-4 w-4"
                />
                Still going (no end time yet)
              </label>
              {!ongoing && (
                <label className="flex flex-col gap-1 text-sm text-slate-400">
                  End
                  <input
                    type="datetime-local"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  />
                </label>
              )}
            </>
          )}

          {kind === "sleep" && (
            <div className="grid grid-cols-3 gap-2">
              {SLEEP_KINDS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSleepKind(opt.key)}
                  className={`rounded-xl border py-2 text-sm font-medium ${
                    sleepKind === opt.key ? `border-transparent ${opt.active}` : "border-slate-700 text-slate-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {type === "feed" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFeedType("breastmilk")}
                  className={`rounded-xl border py-2 text-sm font-medium ${
                    feedType === "breastmilk"
                      ? "border-transparent bg-emerald-700 text-emerald-50"
                      : "border-slate-700 text-slate-400"
                  }`}
                >
                  Boob
                </button>
                <button
                  onClick={() => setFeedType("formula")}
                  className={`rounded-xl border py-2 text-sm font-medium ${
                    feedType === "formula"
                      ? "border-transparent bg-emerald-300 text-emerald-950"
                      : "border-slate-700 text-slate-400"
                  }`}
                >
                  Bottle
                </button>
              </div>
              <div className="flex gap-2">
                <label className="flex flex-1 flex-col gap-1 text-sm text-slate-400">
                  Amount
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 120"
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  />
                </label>
                <div className="flex flex-col gap-1 text-sm text-slate-400">
                  Unit
                  <div className="flex overflow-hidden rounded-lg border border-slate-700">
                    {(["ml", "oz"] as AmountUnit[]).map((u) => (
                      <button
                        key={u}
                        onClick={() => setUnit(u)}
                        className={`px-3 py-2 text-sm ${unit === u ? "bg-slate-700 text-white" : "bg-slate-900 text-slate-400"}`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {type === "supplement" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSupplementType("vitaminD")}
                className={`rounded-xl border py-2 text-sm font-medium ${
                  supplementType === "vitaminD"
                    ? "border-transparent bg-red-300 text-red-950"
                    : "border-slate-700 text-slate-400"
                }`}
              >
                Vitamin D
              </button>
              <button
                onClick={() => setSupplementType("iron")}
                className={`rounded-xl border py-2 text-sm font-medium ${
                  supplementType === "iron"
                    ? "border-transparent bg-red-800 text-red-50"
                    : "border-slate-700 text-slate-400"
                }`}
              >
                Iron
              </button>
            </div>
          )}

          {type === "diaper" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDiaperType("wet")}
                className={`rounded-xl border py-2 text-sm font-medium ${
                  diaperType === "wet"
                    ? "border-transparent bg-sky-300 text-sky-950"
                    : "border-slate-700 text-slate-400"
                }`}
              >
                Wet
              </button>
              <button
                onClick={() => setDiaperType("poopy")}
                className={`rounded-xl border py-2 text-sm font-medium ${
                  diaperType === "poopy"
                    ? "border-transparent bg-amber-700 text-amber-50"
                    : "border-slate-700 text-slate-400"
                }`}
              >
                Poopy
              </button>
            </div>
          )}

          <label className="flex flex-col gap-1 text-sm text-slate-400">
            Note (optional)
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>

          {!confirmDelete && (
            <div className="flex gap-2 pt-2">
              {initial && onDelete && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  disabled={busy}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-900 px-4 py-3 text-rose-400 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={save}
                disabled={busy}
                className="flex-1 rounded-xl bg-indigo-500 py-3 font-medium text-white disabled:opacity-50"
              >
                Save
              </button>
            </div>
          )}
          </div>

          {confirmDelete && (
            <div className="absolute inset-0 rounded-t-2xl bg-slate-950/85 backdrop-blur-[1px]" />
          )}
        </div>

        {confirmDelete && (
          <div className="flex flex-col gap-2 p-4">
            <p className="text-center text-sm text-slate-400">Delete this entry? This can't be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={busy}
                className="flex-1 rounded-xl border border-slate-700 py-3 font-medium text-slate-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmedDelete}
                disabled={busy}
                className="flex-1 rounded-xl bg-rose-600 py-3 font-medium text-white disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
