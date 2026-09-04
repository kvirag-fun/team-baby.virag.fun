import { useEffect, useMemo, useRef, useState } from "react";
import type { Entry, EntryType } from "@/lib/types";
import { ActivityRibbon } from "./ActivityRibbon";
import { EntryList } from "./EntryList";

const PAGES: { type: EntryType; label: string; dot: string }[] = [
  { type: "sleep", label: "Sleep", dot: "bg-indigo-400" },
  { type: "awake", label: "Awake", dot: "bg-amber-400" },
  { type: "feed", label: "Feed", dot: "bg-emerald-400" },
  { type: "diaper", label: "Diapers", dot: "bg-sky-400" },
  { type: "supplement", label: "Supplements", dot: "bg-red-400" },
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

  const byType = useMemo(() => {
    const map: Record<EntryType, Entry[]> = { sleep: [], awake: [], feed: [], supplement: [], diaper: [] };
    for (const e of entries) map[e.type].push(e);
    return map;
  }, [entries]);

  function onScroll() {
    const el = containerRef.current;
    if (!el) return;
    setPage(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goTo(i: number) {
    containerRef.current?.scrollTo({ left: i * containerRef.current.clientWidth, behavior: "smooth" });
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
    <div className="flex flex-col">
      <div className="flex justify-center gap-1.5 pb-1 pt-1">
        {PAGES.map((p, i) => (
          <button
            key={p.type}
            onClick={() => goTo(i)}
            aria-label={`Go to ${p.label}`}
            className={`h-1.5 rounded-full transition-all ${page === i ? `w-6 ${p.dot}` : "w-1.5 bg-slate-700"}`}
          />
        ))}
      </div>
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="flex overflow-x-auto"
        style={{ scrollbarWidth: "none", touchAction: "pan-y" }}
      >
        {PAGES.map((p) => (
          <div key={p.type} className="w-full shrink-0">
            <ActivityRibbon type={p.type} entries={entries} />
            <EntryList entries={byType[p.type]} onEdit={onEdit} />
          </div>
        ))}
      </div>
    </div>
  );
}
