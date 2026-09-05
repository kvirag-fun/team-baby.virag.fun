import { useEffect, useRef } from "react";

/** Biggest correction we'll ever apply, in CSS px. A real drift is one
 * safe-area inset tall (59px on a notched iPhone); anything past this means
 * the assumption below is wrong on this device and we'd rather leave the bar
 * where the browser put it than shove it off-screen. */
const MAX_DRIFT = 100;

/** How long to keep re-checking after launch. iOS settles within a second or
 * two, but nothing fires when it does. */
const SETTLE_MS = 4000;

function isFullScreenPortrait() {
  // screen.height is only the app's height when the app owns the whole
  // screen, and iOS doesn't swap screen.width/height on rotation — so this
  // is only trustworthy in a standalone launch held upright.
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone && window.innerHeight > window.innerWidth;
}

/** Keeps a `position: fixed; bottom: 0` element actually touching the bottom
 * of the screen.
 *
 * With `viewport-fit=cover` and a black-translucent status bar, iOS hands out
 * viewport heights that exclude the status-bar strip while the window really
 * is the full screen — and for the first moment after an installed PWA
 * launches it is shorter still. `bottom: 0` resolves against that, so the bar
 * starts one safe-area inset above the screen edge with a band of background
 * under it, and only drops into place once iOS re-reports (which is why
 * scrolling the list appeared to fix it).
 *
 * So don't ask the viewport how tall it is. Measure where the element
 * actually landed, compare it to screen.height, and translate away the
 * difference. Each pass measures the already-translated box, so repeated
 * passes converge — and once iOS reports honestly the drift is zero and the
 * transform is dropped. */
export function useBottomAnchor<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    let applied = 0;

    const sync = () => {
      const el = ref.current;
      if (!el) return;
      if (!isFullScreenPortrait()) {
        if (applied !== 0) {
          applied = 0;
          el.style.transform = "";
        }
        return;
      }

      const drift = window.screen.height - el.getBoundingClientRect().bottom;
      if (Math.abs(drift) < 0.5) return;

      // Only ever push the bar down: a negative result would mean the screen
      // is shorter than the window, which isn't the bug being fixed here.
      const next = Math.max(0, Math.min(applied + drift, MAX_DRIFT));
      if (next === applied) return;
      applied = next;
      el.style.transform = next ? `translateY(${next}px)` : "";
    };

    let frame = 0;
    const deadline = Date.now() + SETTLE_MS;
    const poll = () => {
      sync();
      if (Date.now() < deadline) frame = requestAnimationFrame(poll);
    };
    poll();

    // After the launch window, re-check only when something could have moved
    // it: a scroll inside the list (capture, since the scrollers are nested),
    // a rotation, or coming back from the background.
    window.addEventListener("scroll", sync, true);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    window.addEventListener("pageshow", sync);
    document.addEventListener("visibilitychange", sync);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", sync, true);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      window.removeEventListener("pageshow", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return ref;
}
