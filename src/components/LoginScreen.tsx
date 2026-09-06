import { useState } from "react";
import { Baby, Loader2 } from "lucide-react";

export function LoginScreen({
  onLogin,
  onResetPassword,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResetSent(false);
    try {
      await onLogin(email, password);
    } catch {
      setError("Wrong email or password.");
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    if (!email) {
      setError("Enter your email above first.");
      return;
    }
    setBusy(true);
    setError(null);
    setResetSent(false);
    try {
      await onResetPassword(email);
      setResetSent(true);
    } catch {
      setError("Couldn't send a reset email — check the address is right.");
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
        <p className="text-sm text-slate-400">Sign in to continue</p>
      </div>
      {/* Shaped for iOS AutoFill, which needs more than the right input types:
          a real form, `name` and `id` on both fields, and the documented
          username/current-password pairing. `autocomplete="email"` describes a
          newsletter box, not a login, and on its own the Passwords app often
          declines to offer anything. */}
      <form onSubmit={submit} className="flex w-full max-w-xs flex-col gap-3">
        <input
          type="email"
          id="email"
          name="email"
          autoFocus
          autoComplete="username"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base outline-none focus:border-indigo-400"
        />
        <input
          type="password"
          id="current-password"
          name="password"
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base outline-none focus:border-indigo-400"
        />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        {resetSent && <p className="text-sm text-emerald-400">Check your email for a reset link.</p>}
        <button
          type="submit"
          disabled={busy || email.length === 0 || password.length === 0}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </button>
        <button
          type="button"
          onClick={forgotPassword}
          disabled={busy}
          className="text-sm text-slate-500 underline-offset-2 hover:underline disabled:opacity-50"
        >
          Forgot password?
        </button>
      </form>
    </div>
  );
}
