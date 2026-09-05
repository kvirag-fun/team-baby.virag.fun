import { useEffect } from "react";

/** When to retry, in ms after mount. iOS usually settles in the first few
 * hundred ms; the later ones are for a cold start behind a slow network. */
const RETRIES = [0, 120, 350, 700, 1200, 2000, 3000];

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** True while iOS is still handing out the short launch viewport. In a
 * standalone portrait launch the app owns the whole screen, so a window
 * shorter than the screen means it hasn't settled yet. */
function isShort() {
  if (!isStandalone()) return false;
  if (window.innerHeight <= window.innerWidth) return false;
  return window.innerHeight < window.screen.height - 1;
}

/** Makes iOS re-resolve the window size after an installed PWA launches.
 *
 * The app starts up rendered into a window one safe-area inset shorter than
 * the screen, so the bottom bar — pinned to `bottom: 0` — sits above the
 * screen edge with a band of background under it. Nothing drawn inside the
 * page can fill that band, because the page isn't being rendered there:
 * translating the bar down into it only pushes it out of the drawn area and
 * clips it. The only thing that fixes it is iOS re-measuring, which is what a
 * swipe was doing by hand.
 *
 * So provoke that directly. Re-parsing the viewport meta asks for a viewport
 * recalculation, and a one-pixel document scroll is the closest thing to the
 * swipe that worked. Both are cheap and neither is visible, so we do both,
 * and stop as soon as the window matches the screen. */
export function useViewportSettle() {
  useEffect(() => {
    if (!isShort()) return;

    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const original = meta?.getAttribute("content") ?? null;

    const nudge = () => {
      // Semantically identical content, different string — enough to make the
      // viewport be parsed again, with nothing to see if it isn't.
      if (meta && original) {
        meta.setAttribute("content", `${original}, minimum-scale=1`);
        requestAnimationFrame(() => meta.setAttribute("content", original));
      }

      // A scroll the document is normally too short to allow. The spacer is
      // added and removed within the same task, so it never paints.
      const spacer = document.createElement("div");
      spacer.style.cssText = "position:absolute;top:0;left:0;width:1px;height:calc(100% + 2px);pointer-events:none;opacity:0";
      document.body.appendChild(spacer);
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "auto";
      window.scrollTo(0, 1);
      window.scrollTo(0, 0);
      document.body.style.overflow = previousOverflow;
      spacer.remove();
    };

    const timers = RETRIES.map((delay) =>
      window.setTimeout(() => {
        if (isShort()) nudge();
      }, delay),
    );

    return () => {
      timers.forEach(window.clearTimeout);
      if (meta && original) meta.setAttribute("content", original);
    };
  }, []);
}
