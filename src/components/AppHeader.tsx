import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { useBabyName } from "@/hooks/useBabyName";
import { setBabyName } from "@/lib/settings";

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
    <header className="flex items-center gap-1.5 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+1rem)]">
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
    </header>
  );
}
