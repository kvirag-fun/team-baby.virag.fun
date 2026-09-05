/** How long to keep scrolling the document by hand. Each attempt moves the
 * page and puts it back, which is invisible while the app is still booting
 * but would read as a twitch once there's something on screen — so the
 * attempts stop while settle mode itself stays armed, leaving the user's own
 * swipe able to do the same job. */
const KICKS = 10;

/** How long one attempt holds the scrolled position. An instant there-and-back
 * inside a single task doesn't register as a scroll at all. */
const KICK_HOLD_MS = 150;

/** The longest the bottom bar is kept hidden waiting for the window to be
 * resized. It is revealed the moment that happens; this is only the backstop
 * for a device where it never does, which should still have a nav. */
const HIDE_CAP_MS = 4000;

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

  const startedAt = Date.now();
  let armed = false;
  let kicksLeft = KICKS;

  const missing = () => Math.max(1, window.screen.height - window.innerHeight);

  const disarm = () => {
    if (!armed) return;
    armed = false;
    style.remove();
    window.scrollTo(0, 0);
  };

  const kick = () => {
    if (!armed || kicksLeft <= 0) return;
    kicksLeft -= 1;
    // Read a layout property first: this runs before the first render, so the
    // stylesheet that makes the document scrollable may not have been applied
    // yet, and scrolling a document with no extent is a silent no-op.
    void document.documentElement.scrollHeight;
    window.scrollTo(0, missing());
    window.setTimeout(() => {
      if (armed) window.scrollTo(0, 0);
    }, KICK_HOLD_MS);
  };

  const arm = () => {
    if (armed) return;
    armed = true;
    style.textContent = settleCss(missing());
    document.head.appendChild(style);
    kick();
  };

  const check = () => {
    if (!isShort()) {
      disarm();
      reveal();
      return;
    }
    arm();
    kick();
    // Hiding the bar is only better than showing it in the wrong place for so
    // long. Note this is measured against the window settling, not against a
    // stopwatch from boot: the bar doesn't mount until sign-in and the first
    // entries have loaded, which on a cold launch is well after boot — an
    // earlier version expired before the bar existed and so never hid it.
    if (Date.now() - startedAt > HIDE_CAP_MS) reveal();
  };

  // While armed the user's own swipe chains to the document and does the same
  // job, so a touch only needs to make sure settle mode is on.
  const onTouch = check;

  window.setInterval(check, 300);
  // A touch re-arms after a back-off, so the app still heals itself later on
  // if the launch attempts didn't take.
  document.addEventListener("touchstart", onTouch, { passive: true });
  window.addEventListener("pageshow", check);
  document.addEventListener("visibilitychange", check);
  check();
}
