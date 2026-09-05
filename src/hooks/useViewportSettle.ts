import { useEffect } from "react";

/** How long to leave settle mode armed before backing off. The page behaves
 * slightly differently while it's on, so it runs in short bursts and re-arms
 * on the next touch rather than staying on indefinitely. */
const ARMED_MS = 8000;

/** Everything that stands between a swipe and a document-level scroll, lifted
 * for as long as settle mode is armed:
 *
 * - the document is exactly viewport-height (`height: 100%`), so there is
 *   nothing to scroll — give it the height the window is missing. That comes
 *   from the measurement rather than `env(safe-area-inset-top)`, because the
 *   inset is one of the things iOS is getting wrong at this moment and a
 *   zero there would silently make the whole rule do nothing;
 * - `overscroll-behavior-y: none` on the body blocks the rubber-band;
 * - each log page is `overscroll-contain`, so pulling past the end of a list
 *   is absorbed there and never reaches the document. This is why swiping
 *   fixes the bar on a page with nothing to scroll but not on a page with a
 *   full list.
 */
function settleCss(missingPx: number) {
  return `
html { min-height: calc(100% + ${missingPx}px); }
body { overscroll-behavior-y: auto; }
.overscroll-contain { overscroll-behavior: auto !important; }
`;
}

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isTyping() {
  const el = document.activeElement;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || (el as HTMLElement).isContentEditable);
}

/** True while iOS is rendering the app into the short launch window. The app
 * owns the whole screen in a standalone portrait launch, so a window shorter
 * than the screen means it hasn't been resized yet. An open keyboard shortens
 * the window too, and that is not this — hence the typing guard. */
function isShort() {
  if (!isStandalone()) return false;
  if (window.innerHeight <= window.innerWidth) return false;
  if (isTyping()) return false;
  return window.innerHeight < window.screen.height - 1;
}

/** Makes iOS resize the window after an installed PWA launches.
 *
 * iOS launches the app rendered into a window one top-safe-area inset shorter
 * than the screen, so the bottom bar — pinned to `bottom: 0` — sits that far
 * above the screen edge. Nothing drawn in the page can fill the band: the
 * window really is short, and anything positioned into it gets clipped rather
 * than shown (measured — a bar translated down there lost its labels). Only
 * iOS resizing the window fixes it.
 *
 * What provokes the resize is a document-level scroll or rubber-band. That is
 * why this appeared when the log pages each got their own scroller: before
 * that a swipe could move the document, and now `overscroll-contain` absorbs
 * every pull before it gets there.
 *
 * So settle mode puts the document-level scroll back — temporarily — and uses
 * it, both programmatically and by letting the user's own swipe through. It
 * disarms the moment the window matches the screen, and backs off on a timer
 * if it doesn't, re-arming on the next touch. */
export function useViewportSettle() {
  useEffect(() => {
    const style = document.createElement("style");

    let armed = false;
    let backOff = 0;

    const disarm = () => {
      if (!armed) return;
      armed = false;
      window.clearTimeout(backOff);
      style.remove();
      window.scrollTo(0, 0);
    };

    // Two frames apart, so the scrolled position is actually laid out instead
    // of being undone within the same task — which is what made an earlier
    // attempt a no-op.
    const missing = () => Math.max(1, window.screen.height - window.innerHeight);

    const kick = () => {
      if (!armed) return;
      window.scrollTo(0, missing());
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (armed) window.scrollTo(0, 0);
        }),
      );
    };

    const arm = () => {
      if (armed) return;
      armed = true;
      style.textContent = settleCss(missing());
      document.head.appendChild(style);
      backOff = window.setTimeout(disarm, ARMED_MS);
      kick();
    };

    const check = () => {
      if (isShort()) arm();
      else disarm();
    };

    const watcher = window.setInterval(check, 300);
    // A touch re-arms after a back-off, so the app still heals itself later on
    // if the launch attempts didn't take.
    document.addEventListener("touchstart", check, { passive: true });
    window.addEventListener("pageshow", check);
    document.addEventListener("visibilitychange", check);
    check();

    return () => {
      window.clearInterval(watcher);
      document.removeEventListener("touchstart", check);
      window.removeEventListener("pageshow", check);
      document.removeEventListener("visibilitychange", check);
      disarm();
    };
  }, []);
}
