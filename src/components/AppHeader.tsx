import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, Pencil } from "lucide-react";
import { useBabyName } from "@/hooks/useBabyName";
import { useNotificationsEnabled } from "@/hooks/useNotificationsEnabled";
import { setBabyName, setNotificationsEnabled } from "@/lib/settings";
import { hasDevicePermission, registerThisDevice, touchLastSeen } from "@/lib/notifications";

export function AppHeader() {
  const babyName = useBabyName();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setDraft(babyName);
    setEditing(true);
  }

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function save() {
    setEditing(false);
    await setBabyName(draft || "Baby");
  }

  return (
    <header className="flex items-center justify-between gap-1.5 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div className="flex items-center gap-1.5">
        <h1 className="text-lg font-semibold">Team</h1>
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.blur()}
            maxLength={40}
            placeholder="Baby"
            className="w-32 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-lg font-semibold text-white outline-none focus:border-indigo-400"
          />
        ) : (
          <button onClick={startEdit} className="flex items-center gap-1 text-lg font-semibold text-white">
            {babyName || "Baby"}
            <Pencil className="h-3.5 w-3.5 text-slate-500" />
          </button>
        )}
      </div>
      <NotificationsToggle />
    </header>
  );
}

function NotificationsToggle() {
  const enabled = useNotificationsEnabled();
  const [busy, setBusy] = useState(false);
  const active = enabled && hasDevicePermission();

  // Keeps this device's lastSeen fresh on every app open while notifications
  // are on, so an in-use install never looks abandoned to the server-side
  // staleness pruning in notifyOnNewEntry.
  useEffect(() => {
    if (active) touchLastSeen();
  }, [active]);

  async function toggle() {
    setBusy(true);
    try {
      if (active) {
        await setNotificationsEnabled(false);
      } else {
        const ok = await registerThisDevice();
        if (ok) await setNotificationsEnabled(true);
        else alert("Couldn't turn on notifications — check Settings > Notifications for this app, and that you have a network connection.");
      }
    } catch (err) {
      alert(`Notifications setup failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={active ? "Turn off notifications" : "Turn on notifications"}
      className={`flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-60 ${
        active ? "bg-red-500/20 text-red-300" : "text-slate-500"
      }`}
    >
      {active ? <Bell className="h-4.5 w-4.5" /> : <BellOff className="h-4.5 w-4.5" />}
    </button>
  );
}
