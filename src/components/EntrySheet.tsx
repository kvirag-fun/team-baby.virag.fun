import { useState } from "react";
import { Moon, Sun, Milk, Trash2, X } from "lucide-react";
import type { AmountUnit, Entry, EntryType, FeedType, NewEntry } from "@/lib/types";
import { toInputValue, fromInputValue } from "@/lib/time";

const TYPE_OPTIONS: { key: EntryType; label: string; icon: typeof Moon; active: string }[] = [
  { key: "sleep", label: "Sleep", icon: Moon, active: "bg-indigo-500 text-white" },
  { key: "awake", label: "Awake", icon: Sun, active: "bg-amber-400 text-amber-950" },
  { key: "feed", label: "Feed", icon: Milk, active: "bg-emerald-500 text-white" },
];

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
  const [type, setType] = useState<EntryType>(initial?.type ?? "sleep");
  const [start, setStart] = useState(toInputValue(initial?.startTime ?? Date.now()));
  const [ongoing, setOngoing] = useState(initial ? initial.endTime == null : false);
  const [end, setEnd] = useState(toInputValue(initial?.endTime ?? Date.now()));
  const [feedType, setFeedType] = useState<FeedType>(initial?.feedType ?? "breastmilk");
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : "");
  const [unit, setUnit] = useState<AmountUnit>(initial?.amountUnit ?? "ml");
  const [note, setNote] = useState(initial?.note ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const startTime = fromInputValue(start);
      const entry: NewEntry = {
        type,
        startTime,
        endTime: type === "feed" ? null : ongoing ? null : fromInputValue(end),
        feedType: type === "feed" ? feedType : null,
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

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/60" onClick={onClose}>
      <div
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-slate-950 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="text-lg font-semibold">{initial ? "Edit entry" : "New entry"}</h2>
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setType(opt.key)}
                className={`flex flex-col items-center gap-1 rounded-xl border py-3 ${
                  type === opt.key ? `border-transparent ${opt.active}` : "border-slate-700 text-slate-400"
                }`}
              >
                <opt.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1 text-sm text-slate-400">
            {type === "feed" ? "Time" : "Start"}
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>

          {type !== "feed" && (
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
                  Breastmilk
                </button>
                <button
                  onClick={() => setFeedType("formula")}
                  className={`rounded-xl border py-2 text-sm font-medium ${
                    feedType === "formula"
                      ? "border-transparent bg-emerald-300 text-emerald-950"
                      : "border-slate-700 text-slate-400"
                  }`}
                >
                  Formula
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

          <label className="flex flex-col gap-1 text-sm text-slate-400">
            Note (optional)
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>

          <div className="flex gap-2 pt-2">
            {initial && onDelete && (
              <button
                onClick={() => onDelete(initial.id).then(onClose)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-900 px-4 py-3 text-rose-400"
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
        </div>
      </div>
    </div>
  );
}
