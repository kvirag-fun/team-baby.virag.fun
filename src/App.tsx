import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEntries } from "@/hooks/useEntries";
import { LoginScreen } from "@/components/LoginScreen";
import { BottomNav, type Tab } from "@/components/BottomNav";
import { LogPager } from "@/components/LogPager";
import { CalendarView } from "@/components/CalendarView";
import { StatsView } from "@/components/StatsView";
import { EntrySheet } from "@/components/EntrySheet";
import { createEntry, deleteEntry, updateEntry } from "@/lib/entries";
import type { Entry, NewEntry } from "@/lib/types";

export default function App() {
  const { user, loading, login, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("timeline");
  const [sheetEntry, setSheetEntry] = useState<Entry | "new" | null>(null);

  if (loading) return null;
  if (!user) return <LoginScreen onLogin={login} />;

  return (
    <AppShell
      tab={tab}
      setTab={setTab}
      sheetEntry={sheetEntry}
      setSheetEntry={setSheetEntry}
      onLock={logout}
    />
  );
}

function AppShell({
  tab,
  setTab,
  sheetEntry,
  setSheetEntry,
  onLock,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  sheetEntry: Entry | "new" | null;
  setSheetEntry: (e: Entry | "new" | null) => void;
  onLock: () => void;
}) {
  const { entries, loading, error } = useEntries();

  async function handleSave(entry: NewEntry) {
    if (sheetEntry && sheetEntry !== "new") await updateEntry(sheetEntry.id, entry);
    else await createEntry(entry);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col pb-24">
      <header className="px-4 pb-2 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <h1 className="text-lg font-semibold">Team Baby</h1>
      </header>

      {error && <p className="px-4 pb-2 text-sm text-rose-400">{error}</p>}
      {loading ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">Loading…</p>
      ) : (
        <>
          {tab === "timeline" && <LogPager entries={entries} onEdit={setSheetEntry} />}
          {tab === "calendar" && <CalendarView entries={entries} onEdit={setSheetEntry} />}
          {tab === "stats" && <StatsView entries={entries} />}
        </>
      )}

      <BottomNav tab={tab} onTab={setTab} onAdd={() => setSheetEntry("new")} onLock={onLock} />

      {sheetEntry && (
        <EntrySheet
          initial={sheetEntry === "new" ? null : sheetEntry}
          onClose={() => setSheetEntry(null)}
          onSave={handleSave}
          onDelete={sheetEntry !== "new" ? deleteEntry : undefined}
        />
      )}
    </div>
  );
}
