import { useEffect, useState } from "react";
import { checkConnection } from "@/lib/connection";

type Subscribe<T> = (onChange: (value: T) => void, onError: (err: Error) => void) => () => void;

/** Wraps a Firestore onSnapshot subscription with the two kinds of recovery
 * it doesn't do for itself.
 *
 * A Firestore listener is torn down for good when it errors — it is never
 * retried — so anything that trips it once (an expired token, a rules
 * rejection) leaves the screen empty until the app is restarted. This
 * resubscribes with backoff instead.
 *
 * Worse, a listener can go dead *without* erroring: an installed PWA that
 * iOS has suspended in the background comes back with a connection that
 * never delivers and never fails, so nothing arrives and no error handler
 * runs — the app just sits on "Loading…". Nothing in the SDK notices.
 *
 * Re-establishing on every return to the foreground fixed that, and cost a
 * fortune: a fresh listener re-reads its whole result set, so the entries
 * query alone was one billed read per entry per foreground. Now a return to
 * the foreground asks a single cheap question first — see checkConnection —
 * and only rebuilds when the answer is bad, or when this subscription has
 * never actually delivered anything. */
export function useSubscription<T>(subscribe: Subscribe<T>, initial: T) {
  const [state, setState] = useState<{ value: T; loading: boolean; error: string | null }>({
    value: initial,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let retryTimer: number | undefined;
    let attempt = 0;
    let stopped = false;
    // Whether this subscription has produced anything since it was started.
    // A listener that has never delivered is stuck whatever the canary says.
    let delivered = false;
    let hiddenAt = 0;

    function start() {
      delivered = false;
      unsub = subscribe(
        (value) => {
          attempt = 0;
          delivered = true;
          setState({ value, loading: false, error: null });
        },
        (err) => {
          unsub = undefined;
          setState((s) => ({ ...s, loading: false, error: err.message }));
          if (stopped) return;
          // 1s, 2s, 4s … capped, so a rules rejection that will never
          // succeed doesn't hammer the backend.
          retryTimer = window.setTimeout(start, Math.min(30_000, 1000 * 2 ** attempt++));
        },
      );
    }

    function restart() {
      if (stopped || document.visibilityState !== "visible") return;
      window.clearTimeout(retryTimer);
      unsub?.();
      unsub = undefined;
      attempt = 0;
      start();
    }

    /** An absence shorter than this can't have killed the connection, so it
     * isn't worth even the one read to check. */
    const MIN_HIDDEN_MS = 10_000;

    async function onVisibility() {
      if (document.visibilityState !== "visible") {
        hiddenAt = Date.now();
        return;
      }
      // Nothing running, or nothing ever received: rebuild without asking,
      // since the canary can't tell us anything we'd act on differently.
      if (!unsub || !delivered) {
        restart();
        return;
      }
      if (Date.now() - hiddenAt < MIN_HIDDEN_MS) return;
      if (!(await checkConnection())) restart();
    }

    async function onOnline() {
      if (!unsub || !delivered || !(await checkConnection())) restart();
    }

    start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);

    return () => {
      stopped = true;
      window.clearTimeout(retryTimer);
      unsub?.();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, [subscribe]);

  return state;
}
