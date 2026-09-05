import { useEffect, useMemo, useRef, useState } from "react";
import type { Entry, EntryType } from "@/lib/types";
import { ActivityRibbon } from "./ActivityRibbon";
import { EntryList } from "./EntryList";

// A page can cover more than one entry type: nap, overnight and awake are
// three alternatives of the same thing (the baby is always in exactly one of
// them), so they share one page rather than being split across two.
const PAGES: { key: "sleep" | "feed" | "supplement" | "diaper"; label: string; dot: string; types: EntryType[] }[] = [
  { key: "sleep", label: "Sleep & awake", dot: "bg-indigo-400", types: ["sleep", "awake"] },
  { key: "feed", label: "Feed", dot: "bg-emerald-400", types: ["feed"] },
  { key: "diaper", label: "Diapers", dot: "bg-sky-400", types: ["diaper"] },
  { key: "supplement", label: "Supplements", dot: "bg-red-400", types: ["supplement"] },
];

const SWIPE_AXIS_THRESHOLD = 8;
// Drag past 22% of the page width to change pages, or flick quickly a
// shorter distance — matches typical mobile carousel feel instead of
// requiring the drag to cross the halfway point.
const SWIPE_DISTANCE_FRACTION = 0.22;
const SWIPE_VELOCITY_PX_PER_MS = 0.5;
// Rubber-band feel at the first/last page: resists rather than hard-stops,
// capped so it never stretches more than this many px.
const RUBBER_BAND_MAX_PX = 70;
const RUBBER_BAND_RESISTANCE = 0.55;
const SNAP_BACK_MS = 220;

function rubberBand(overshoot: number) {
  const d = RUBBER_BAND_MAX_PX;
  const c = RUBBER_BAND_RESISTANCE;
  return (overshoot * c * d) / (d + c * overshoot);
}

export function LogPager({ entries, onEdit }: { entries: Entry[]; onEdit: (e: Entry) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  // Filtering the already-sorted list per page keeps one ordering for all of
  // them, rather than concatenating per-type buckets and re-sorting.
  const byPage = useMemo(
    () => PAGES.map((p) => entries.filter((e) => p.types.includes(e.type))),
    [entries],
  );

  // Each page scrolls itself rather than the whole document scrolling behind
  // them: side by side in one document scroller, every page was as tall as
  // the tallest, so a page with five entries scrolled through the empty
  // height of a page with a hundred.
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pageIndexRef = useRef(0);

  // One shared offset the whole pager is "at", rather than each page keeping
  // its own. Every page shows min(this, its own maximum), so moving to a
  // shorter page lands at its bottom — and because what's remembered is the
  // offset asked for and not the clamped result, coming back to a longer page
  // returns to where it actually was rather than to the short page's bottom.
  const desiredScrollRef = useRef(0);

  function onScroll() {
    const el = containerRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    pageIndexRef.current = i;
    setPage(i);
  }

  /** Lines every other page up with the shared offset. Skips the page in
   * front of you, so its scroll position — the one the shared offset is read
   * from — is never written by this. */
  function carryScroll() {
    pageRefs.current.forEach((el, i) => {
      if (!el || i === pageIndexRef.current) return;
      el.scrollTop = Math.min(desiredScrollRef.current, Math.max(0, el.scrollHeight - el.clientHeight));
    });
  }

  const carryScrollRef = useRef(carryScroll);
  carryScrollRef.current = carryScroll;

  function goTo(i: number) {
    const el = containerRef.current;
    if (!el) return;
    carryScroll();
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  // touch-action is pan-y so vertical scrolling of the list below stays fully
  // native. Horizontal swipe is instead driven manually here, and only once a
  // gesture is confidently horizontal (past a small threshold) — so a touch
  // starting on a button (Start/End, an entry row) still scrolls vertically
  // just fine, and only a clear left-right drag pages the pager.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const el: HTMLDivElement = container;

    let startX = 0;
    let startY = 0;
    let startScrollLeft = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0; // px/ms, smoothed
    let axis: "x" | "y" | null = null;
    let overscroll = 0; // current rubber-band offset in px, 0 when in-bounds

    function setOverscroll(px: number) {
      overscroll = px;
      el.style.transform = px === 0 ? "" : `translateX(${px}px)`;
    }

    function onTouchStart(e: TouchEvent) {
      // Line the neighbours up now, while they're still off-screen — by the
      // time the gesture is known to be horizontal one is already visible.
      carryScrollRef.current();
      const t = e.touches[0];
      startX = lastX = t.clientX;
      startY = t.clientY;
      startScrollLeft = el.scrollLeft;
      lastT = e.timeStamp;
      velocity = 0;
      axis = null;
      el.style.transition = "";
    }

    function onTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      if (axis === null) {
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (Math.abs(dx) < SWIPE_AXIS_THRESHOLD && Math.abs(dy) < SWIPE_AXIS_THRESHOLD) return;
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (axis === "x") {
        e.preventDefault();
        // Recompute the absolute target from the drag's total delta each
        // frame (not an incremental += ) so a native scrollLeft clamp at an
        // edge can never desync our tracking from reality.
        const totalDelta = t.clientX - startX;
        const rawTarget = startScrollLeft - totalDelta;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (rawTarget < 0) {
          el.scrollLeft = 0;
          setOverscroll(rubberBand(-rawTarget));
        } else if (rawTarget > maxScroll) {
          el.scrollLeft = maxScroll;
          setOverscroll(-rubberBand(rawTarget - maxScroll));
        } else {
          el.scrollLeft = rawTarget;
          if (overscroll !== 0) setOverscroll(0);
        }

        // Velocity of scrollLeft, not raw finger movement — finger moving
        // right decreases scrollLeft (reveals the previous page), so this is
        // the negative of finger velocity. Must match dragFraction's sign
        // convention below, since onTouchEnd falls back to this when
        // dragFraction is pinned at exactly 0 (clamped at an edge).
        const dt = Math.max(1, e.timeStamp - lastT);
        velocity = (lastX - t.clientX) / dt;
        lastX = t.clientX;
        lastT = e.timeStamp;
      }
    }

    function onTouchEnd() {
      if (axis === "x") {
        if (overscroll !== 0) {
          el.style.transition = `transform ${SNAP_BACK_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
          setOverscroll(0);
          window.setTimeout(() => {
            el.style.transition = "";
          }, SNAP_BACK_MS);
        }

        const width = el.clientWidth;
        const basePage = Math.round(startScrollLeft / width);
        const dragFraction = (el.scrollLeft - startScrollLeft) / width;
        let target = basePage;
        if (Math.abs(dragFraction) > SWIPE_DISTANCE_FRACTION || Math.abs(velocity) > SWIPE_VELOCITY_PX_PER_MS) {
          const direction = dragFraction !== 0 ? Math.sign(dragFraction) : Math.sign(velocity);
          target = basePage + direction;
        }
        const maxPage = PAGES.length - 1;
        target = Math.min(maxPage, Math.max(0, target));
        el.scrollTo({ left: target * width, behavior: "smooth" });
      }
      axis = null;
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 justify-center gap-1.5 pb-1 pt-1">
        {PAGES.map((p, i) => (
          <button
            key={p.key}
            onClick={() => goTo(i)}
            aria-label={`Go to ${p.label}`}
            className={`h-1.5 rounded-full transition-all ${page === i ? `w-6 ${p.dot}` : "w-1.5 bg-slate-700"}`}
          />
        ))}
      </div>
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="flex min-h-0 flex-1 overflow-x-auto"
        style={{ scrollbarWidth: "none", touchAction: "pan-y" }}
      >
        {PAGES.map((p, i) => (
          <div
            key={p.key}
            ref={(el) => {
              pageRefs.current[i] = el;
            }}
            className="h-full w-full shrink-0 overflow-y-auto overscroll-contain"
            onScroll={(e) => {
              // Only the page actually in front of you moves the shared
              // offset; the others are being written to by carryScroll.
              if (i === pageIndexRef.current) desiredScrollRef.current = e.currentTarget.scrollTop;
            }}
          >
            <ActivityRibbon type={p.key} entries={entries} />
            <EntryList entries={byPage[i]} onEdit={onEdit} />
          </div>
        ))}
      </div>
    </div>
  );
}
