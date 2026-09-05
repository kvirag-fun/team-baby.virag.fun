import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEntries } from "@/hooks/useEntries";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import { LoginScreen } from "@/components/LoginScreen";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav, type Tab } from "@/components/BottomNav";
import { LogPager } from "@/components/LogPager";
import { CalendarView } from "@/components/CalendarView";
import { StatsView } from "@/components/StatsView";
import { EntrySheet } from "@/components/EntrySheet";
import { createEntry, deleteEntry, updateEntry } from "@/lib/entries";
import type { Entry, NewEntry } from "@/lib/types";

export default function App() {
  const { user, loading, login, resetPassword, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("timeline");
  const [sheetEntry, setSheetEntry] = useState<Entry | "new" | null>(null);

  if (loading) return null;
  if (!user) return <LoginScreen onLogin={login} onResetPassword={resetPassword} />;

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
  const viewportHeight = useViewportHeight();

  async function handleSave(entry: NewEntry) {
    if (sheetEntry && sheetEntry !== "new") await updateEntry(sheetEntry.id, entry);
    else await createEntry(entry);
  }

  return (
    // A column the exact height of the viewport: header and nav are fixed
    // slices of it and the middle scrolls. Height comes from a measured value
    // rather than `dvh` because iOS reports a short viewport for a moment
    // after launch (see useViewportHeight) — with the nav pinned to that, it
    // floated above the screen edge until a scroll shook it loose.
    <div className="mx-auto flex max-w-md flex-col overflow-hidden" style={{ height: viewportHeight }}>
      <AppHeader />

      {error && <p className="shrink-0 px-4 pb-2 text-sm text-rose-400">{error}</p>}
      <main className="min-h-0 flex-1 overflow-hidden">
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Loading…</p>
        ) : (
          <>
            {tab === "timeline" && <LogPager entries={entries} onEdit={setSheetEntry} />}
            {/* The pager scrolls its pages itself; these two are plain
                documents, so they get the scroll container here. */}
            {tab === "calendar" && (
              <div className="h-full overflow-y-auto">
                <CalendarView entries={entries} onEdit={setSheetEntry} />
              </div>
            )}
            {tab === "stats" && (
              <div className="h-full overflow-y-auto">
                <StatsView entries={entries} />
              </div>
            )}
          </>
        )}
      </main>

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
