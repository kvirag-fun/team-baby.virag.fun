/** How long settle mode stays armed before backing off. The page behaves
 * slightly differently while it's on, so it runs in bursts rather than
 * staying on indefinitely. */
const ARMED_MS = 8000;

/** How long to leave it alone after a burst that didn't work. Without this the
 * periodic check re-arms on the very next tick and the burst never ends. A
 * touch skips the wait, since a gesture is the thing most likely to succeed. */
const COOLDOWN_MS = 30000;

/** How long the bottom bar stays hidden waiting for the window to be resized.
 * Long enough for the resize to land before anything is painted, short enough
 * that a device where it never lands isn't left without a nav. */
const HIDE_MS = 800;

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

/** Everything that stands between a swipe and a document-level scroll, lifted
 * for as long as settle mode is armed:
 *
 * - the document is exactly viewport-height (`height: 100%`), so there is
 *   nothing to scroll — give it the height the window is missing. That comes
 *   from the measurement rather than `env(safe-area-inset-top)`, because the
 *   inset is one of the things iOS has wrong at this moment and a zero there
 *   would silently make the whole rule do nothing;
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

/** Makes iOS resize the window after an installed PWA launches.
 *
 * iOS launches the app rendered into a window one top-safe-area inset shorter
 * than the screen, so the bottom bar — pinned to `bottom: 0` — sits that far
 * above the screen edge. Nothing drawn in the page can fill the band: the
 * window really is short, and anything positioned into it gets clipped rather
 * than shown. Only iOS resizing the window fixes it, and what provokes that
 * is a document-level scroll or rubber-band.
 *
 * Called from main.tsx before the first render rather than from an effect: a
 * React effect runs after paint, so the bar was painted high and then seen
 * jumping down. Starting here puts the resize in flight before there is
 * anything on screen, and the bar is held hidden for a beat so it appears in
 * its final position instead of moving into it.
 *
 * See CLAUDE.md for the measurements and the four approaches that failed. */
export function startViewportSettle() {
  if (!isShort()) return;

  const style = document.createElement("style");
  // Separate element so the bar can be revealed on its own schedule, without
  // disarming the settle itself.
  const hider = document.createElement("style");
  hider.textContent = "[data-bottom-nav] { visibility: hidden; }";
  document.head.appendChild(hider);
  const reveal = () => hider.remove();
  window.setTimeout(reveal, HIDE_MS);

  let armed = false;
  let backOff = 0;
  let cooldownUntil = 0;

  const missing = () => Math.max(1, window.screen.height - window.innerHeight);

  const disarm = (cooldown = false) => {
    if (cooldown) cooldownUntil = Date.now() + COOLDOWN_MS;
    if (!armed) return;
    armed = false;
    window.clearTimeout(backOff);
    style.remove();
    window.scrollTo(0, 0);
    reveal();
  };

  // Two frames apart, so the scrolled position is actually laid out instead of
  // being undone within the same task — which is what made an earlier attempt
  // a no-op.
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
    if (armed || Date.now() < cooldownUntil) return;
    armed = true;
    style.textContent = settleCss(missing());
    document.head.appendChild(style);
    backOff = window.setTimeout(() => disarm(true), ARMED_MS);
    kick();
  };

  const check = () => {
    if (isShort()) arm();
    else disarm();
  };

  // A gesture is the thing most likely to make iOS resize, so a touch always
  // gets a fresh attempt regardless of where the cooldown stands.
  const onTouch = () => {
    cooldownUntil = 0;
    check();
  };

  window.setInterval(check, 300);
  // A touch re-arms after a back-off, so the app still heals itself later on
  // if the launch attempts didn't take.
  document.addEventListener("touchstart", onTouch, { passive: true });
  window.addEventListener("pageshow", check);
  document.addEventListener("visibilitychange", check);
  check();
}
