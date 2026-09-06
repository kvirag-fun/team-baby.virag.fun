import { useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import type { EntryType } from "@/lib/types";
import {
  ALL_NOTIFICATION_TYPES,
  hasDevicePermission,
  registerThisDevice,
  setNotificationTypes,
  subscribeNotificationTypes,
  type NotificationTypes,
} from "@/lib/notifications";
import { setNotificationsEnabled } from "@/lib/settings";
import { useSheetScrollLock } from "@/hooks/useSheetScrollLock";

// Sleep and awake are separate rows rather than one, because they arrive as
// separate moments: a push goes out when a stretch is *started*, never when
// it ends (ending an entry is an update, and only creating one notifies).
const ROWS: { key: EntryType; label: string; hint: string }[] = [
  { key: "sleep", label: "Sleep", hint: "When a nap or overnight starts" },
  { key: "awake", label: "Awake", hint: "When awake time starts" },
  { key: "feed", label: "Feeds", hint: "Breast and bottle" },
  { key: "diaper", label: "Diapers", hint: "Wet and poopy" },
  { key: "supplement", label: "Supplements", hint: "Vitamin D and iron" },
  { key: "bath", label: "Baths", hint: "Bottom, body and hair" },
];

/** A switch. Not an <input type="checkbox">, because this needs to look the
 * same on both phones and iOS styles native checkboxes its own way. */
function Switch({ on, disabled, onClick }: { on: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
        on ? "bg-indigo-500" : "bg-slate-700"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[1.375rem]" : "left-0.5"}`}
      />
    </button>
  );
}

export function NotificationsSheet({
  enabled,
  onClose,
}: {
  /** From the header's settings subscription — this sheet deliberately does
   * not open one of its own. */
  enabled: boolean;
  onClose: () => void;
}) {
  const active = enabled && hasDevicePermission();
  const [types, setTypes] = useState<NotificationTypes>(ALL_NOTIFICATION_TYPES);
  const [busy, setBusy] = useState(false);
  const panelRef = useSheetScrollLock<HTMLDivElement>();

  useEffect(() => subscribeNotificationTypes(setTypes, (err) => console.error(err)), []);

  async function toggleMaster() {
    setBusy(true);
    try {
      if (active) {
        await setNotificationsEnabled(false);
      } else {
        const ok = await registerThisDevice();
        if (ok) await setNotificationsEnabled(true);
        else
          alert(
            "Couldn't turn on notifications — check Settings > Notifications for this app, and that you have a network connection.",
          );
      }
    } catch (err) {
      alert(`Notifications setup failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  // Written straight through rather than gathered behind a Save button: a
  // switch that doesn't take effect until you press something else reads as
  // broken. The optimistic local update keeps the switch instant; the
  // subscription corrects it if the write fails.
  async function toggleType(key: EntryType) {
    const next = { ...types, [key]: !types[key] };
    setTypes(next);
    try {
      await setNotificationTypes(next);
    } catch (err) {
      alert(`Couldn't save: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/60" onClick={onClose}>
      <div
        ref={panelRef}
        className="max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-2xl bg-slate-950 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          {/* The master switch, shared by both phones — the same thing the
              bell used to do on its own. */}
          <div className="flex items-center gap-3 rounded-xl bg-slate-900 p-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                active ? "bg-red-500/20 text-red-300" : "text-slate-500"
              }`}
            >
              {active ? <Bell className="h-4.5 w-4.5" /> : <BellOff className="h-4.5 w-4.5" />}
            </span>
            <span className="flex-1">
              <span className="block font-medium">Notifications</span>
              <span className="block text-sm text-slate-500">Shared — turns them off for both phones</span>
            </span>
            <Switch on={active} disabled={busy} onClick={toggleMaster} />
          </div>

          <div className="flex flex-col gap-1">
            <p className="px-1 pb-1 text-sm text-slate-400">
              Send to this phone
              <span className="block text-xs text-slate-600">Only affects this phone, not the other one</span>
            </p>
            {ROWS.map((row) => (
              <div
                key={row.key}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${active ? "" : "opacity-40"}`}
              >
                <span className="flex-1">
                  <span className="block font-medium">{row.label}</span>
                  <span className="block text-xs text-slate-500">{row.hint}</span>
                </span>
                <Switch on={types[row.key]} disabled={!active} onClick={() => toggleType(row.key)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
