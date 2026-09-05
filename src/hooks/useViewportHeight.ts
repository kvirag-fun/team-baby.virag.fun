import { useEffect, useState } from "react";

function measure() {
  // visualViewport is the more reliable of the two on iOS; innerHeight is the
  // fallback for anything that doesn't have it.
  return window.visualViewport?.height ?? window.innerHeight;
}

/** The viewport height as the device actually reports it, rather than what
 * `100dvh` resolves to.
 *
 * An installed PWA on iOS reports a short layout viewport for a moment after
 * launch. With the nav pinned at `bottom: 0` that left it floating above the
 * screen edge with a band of background below it, until a scroll made iOS
 * re-report and it snapped down. Measuring here means the whole app column is
 * sized from one number that gets re-read whenever the device settles — and
 * the nav can sit at the end of that column instead of being pinned to a
 * viewport that lies. */
export function useViewportHeight() {
  const [height, setHeight] = useState(measure);

  useEffect(() => {
    const update = () => setHeight(measure());
    const vv = window.visualViewport;

    vv?.addEventListener("resize", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.addEventListener("pageshow", update);
    document.addEventListener("visibilitychange", update);
    // The launch value is the wrong one and nothing necessarily fires when it
    // settles, so re-read over the first moments as well.
    const timers = [0, 60, 200, 500, 1000].map((delay) => window.setTimeout(update, delay));

    return () => {
      vv?.removeEventListener("resize", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("pageshow", update);
      document.removeEventListener("visibilitychange", update);
      timers.forEach(window.clearTimeout);
    };
  }, []);

  return height;
}
