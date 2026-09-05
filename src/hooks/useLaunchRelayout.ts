import { useEffect, useRef } from "react";

// When iOS resolves this, the timers stop mattering; they're only here
// because there's no event that fires when the launch viewport settles.
const NUDGE_DELAYS = [0, 100, 300, 600, 1000, 2000];

/** Forces a `position: fixed` element to re-resolve where its bottom edge is,
 * over the first couple of seconds after launch.
 *
 * An installed PWA on iOS reports a short layout viewport while it is
 * starting up. `bottom: 0` resolves against that, so the bottom bar starts
 * above the real screen edge with a band of background under it, and only
 * drops into place once something forces a re-layout — which is why scrolling
 * the list appeared to fix it. Toggling `display` and reading a layout
 * property in between is that force: both happen inside one task, so the
 * browser never paints the hidden state and nothing flickers. */
export function useLaunchRelayout<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const nudge = () => {
      const el = ref.current;
      if (!el) return;
      el.style.display = "none";
      void el.offsetHeight;
      el.style.display = "";
      void el.offsetHeight;
    };

    const timers = NUDGE_DELAYS.map((delay) => window.setTimeout(nudge, delay));
    // Coming back from the background is the other moment iOS hands out a
    // stale viewport.
    window.addEventListener("pageshow", nudge);
    window.addEventListener("orientationchange", nudge);
    document.addEventListener("visibilitychange", nudge);

    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener("pageshow", nudge);
      window.removeEventListener("orientationchange", nudge);
      document.removeEventListener("visibilitychange", nudge);
    };
  }, []);

  return ref;
}
