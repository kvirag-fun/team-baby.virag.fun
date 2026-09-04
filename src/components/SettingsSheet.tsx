import { useState } from "react";
import { X } from "lucide-react";
import { setBabyName } from "@/lib/settings";
import { getRole, setRole, ROLE_MAX_LENGTH } from "@/lib/role";

export function SettingsSheet({ babyName, onClose }: { babyName: string; onClose: () => void }) {
  const [name, setName] = useState(babyName);
  const [role, setRoleDraft] = useState(getRole());
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      // Role is local-only and can't fail; the name is a network write, so
      // only it needs the busy state.
      setRole(role);
      await setBabyName(name || "Baby");
      onClose();
    } catch (err) {
      setBusy(false);
      alert(`Couldn't save settings: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/60" onClick={onClose}>
      <div
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-slate-950 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <label className="flex flex-col gap-1 text-sm text-slate-400">
            Baby's name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Baby"
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-base text-white outline-none focus:border-indigo-400"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-400">
            Your role
            <input
              value={role}
              onChange={(e) => setRoleDraft(e.target.value)}
              maxLength={ROLE_MAX_LENGTH}
              placeholder="Dad, Mom, Grandma…"
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-base text-white outline-none focus:border-indigo-400"
            />
            <span className="text-xs text-slate-500">
              Added to notifications so the other phone sees who logged it. Saved on this
              device only — each phone sets its own.
            </span>
          </label>

          <button
            onClick={save}
            disabled={busy}
            className="rounded-xl bg-indigo-500 py-3 font-medium text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
