import { useEffect, useState } from "react";
import { Bell, BellOff, Settings } from "lucide-react";
import { useAvatar } from "@/hooks/useAvatar";
import { useBabyName } from "@/hooks/useBabyName";
import { useNotificationsEnabled } from "@/hooks/useNotificationsEnabled";
import { hasDevicePermission, touchLastSeen } from "@/lib/notifications";
import { SettingsSheet } from "./SettingsSheet";
import { NotificationsSheet } from "./NotificationsSheet";

export function AppHeader() {
  const babyName = useBabyName();
  const avatar = useAvatar();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between gap-1.5 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <div className="flex min-w-0 items-center gap-2">
          {avatar && <img src={avatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />}
          <h1 className="truncate text-lg font-semibold">Team {babyName || "Baby"}</h1>
        </div>
        <div className="flex items-center gap-1">
          <NotificationsToggle />
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>
      {settingsOpen && (
        <SettingsSheet babyName={babyName} avatar={avatar} onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}

// The bell opens the notifications sheet rather than toggling directly —
// the master switch lives in there now, alongside the per-activity ones.
function NotificationsToggle() {
  const enabled = useNotificationsEnabled();
  const [open, setOpen] = useState(false);
  const active = enabled && hasDevicePermission();

  // Keeps this device's lastSeen fresh on every app open while notifications
  // are on, so an in-use install never looks abandoned to the server-side
  // staleness pruning in notifyOnNewEntry.
  useEffect(() => {
    if (active) touchLastSeen();
  }, [active]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Notifications"
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          active ? "bg-red-500/20 text-red-300" : "text-slate-500"
        }`}
      >
        {active ? <Bell className="h-4.5 w-4.5" /> : <BellOff className="h-4.5 w-4.5" />}
      </button>
      {open && <NotificationsSheet onClose={() => setOpen(false)} />}
    </>
  );
}
