import { useEffect, useState } from "react";

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
 * runs — the app just sits on "Loading…". Nothing in the SDK notices, so
 * every return to the foreground re-establishes the subscription. */
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

    function start() {
      unsub = subscribe(
        (value) => {
          attempt = 0;
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
      if (document.visibilityState !== "visible") return;
      window.clearTimeout(retryTimer);
      unsub?.();
      unsub = undefined;
      attempt = 0;
      start();
    }

    start();
    document.addEventListener("visibilitychange", restart);
    window.addEventListener("online", restart);

    return () => {
      stopped = true;
      window.clearTimeout(retryTimer);
      unsub?.();
      document.removeEventListener("visibilitychange", restart);
      window.removeEventListener("online", restart);
    };
  }, [subscribe]);

  return state;
}
