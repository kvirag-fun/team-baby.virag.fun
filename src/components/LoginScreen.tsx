import { useState } from "react";
import { Baby, Loader2 } from "lucide-react";

export function LoginScreen({ onLogin }: { onLogin: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onLogin(password);
    } catch {
      setError("Wrong password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6">
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-full bg-indigo-500/20 p-4">
          <Baby className="h-8 w-8 text-indigo-300" />
        </div>
        <h1 className="text-xl font-semibold">Team Baby</h1>
        <p className="text-sm text-slate-400">Enter the family password to continue</p>
      </div>
      <form onSubmit={submit} className="flex w-full max-w-xs flex-col gap-3">
        <input
          type="password"
          autoFocus
          inputMode="text"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base outline-none focus:border-indigo-400"
        />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={busy || password.length === 0}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Unlock
        </button>
      </form>
    </div>
  );
}
