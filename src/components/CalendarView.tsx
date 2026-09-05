import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isPointType, type Entry } from "@/lib/types";
import { colorFor, labelFor } from "@/lib/colors";
import { fmtTime, startOfDay } from "@/lib/time";
import { useTick } from "@/hooks/useTick";

const DAY_MS = 86_400_000;
const HOUR_LABELS = Array.from({ length: 25 }, (_, h) => h);

const SWIPE_AXIS_THRESHOLD = 8;
// Drag past this fraction of the width to change day/week, or flick quickly
// a shorter distance — same feel as the Log tab's pager.
const SWIPE_DISTANCE_FRACTION = 0.22;
const SWIPE_VELOCITY_PX_PER_MS = 0.5;
const SLIDE_MS = 260;
const SLIDE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
// The track holds [previous, current, next] side by side at 100% width each,
// so the current one is centred by shifting a third of the track left.
const TRACK_CENTRED_PCT = -33.3333;
const TRACK_CENTRED = `translateX(${TRACK_CENTRED_PCT}%)`;

function daysFor(anchor: number, mode: "day" | "week") {
  if (mode === "day") return [anchor];
  const weekStart = anchor - ((new Date(anchor).getDay() + 6) % 7) * DAY_MS; // Monday start
  return Array.from({ length: 7 }, (_, i) => weekStart + i * DAY_MS);
}

// Point entries are single marks on the grid, so shape carries as much as
// colour does at this size: circle for a feed, square for a supplement,
// diamond for a diaper, triangle for a bath. The diamond is a rotated square
// set slightly smaller, since rotating one to 45° grows its silhouette by its
// diagonal; the triangle is drawn a little larger because clipping a square
// to one leaves it with half the area.
const POINT_SHAPE: Partial<Record<Entry["type"], string>> = {
  feed: "h-2.5 w-2.5 rounded-full",
  supplement: "h-2.5 w-2.5 rounded-[2px]",
  diaper: "h-2 w-2 rotate-45",
  bath: "h-3 w-3 [clip-path:polygon(50%_0%,100%_100%,0%_100%)]",
};

function dayColumn(entries: Entry[], dayStart: number) {
  const dayEnd = dayStart + DAY_MS;
  const ranges = entries.filter(
    (e) => !isPointType(e.type) && e.startTime < dayEnd && (e.endTime ?? Date.now()) > dayStart,
  );
  const points = entries.filter((e) => isPointType(e.type) && e.startTime >= dayStart && e.startTime < dayEnd);
  return { ranges, points, dayStart, dayEnd };
}

function Column({
  data,
  wide,
  onEdit,
}: {
  data: ReturnType<typeof dayColumn>;
  wide: boolean;
  onEdit: (e: Entry) => void;
}) {
  const pct = (ms: number) => ((ms - data.dayStart) / DAY_MS) * 100;
  return (
    <div className="relative flex-1 border-l border-slate-800" style={{ minWidth: wide ? 220 : 40 }}>
      {HOUR_LABELS.map((h) => (
        <div key={h} className="absolute inset-x-0 border-t border-slate-900" style={{ top: `${(h / 24) * 100}%` }} />
      ))}
      {data.ranges.map((e) => {
        const top = Math.max(0, pct(e.startTime));
        const bottom = Math.min(100, pct(e.endTime ?? Date.now()));
        const c = colorFor(e);
        return (
          <button
            key={e.id}
            onClick={() => onEdit(e)}
            className={`absolute inset-x-0.5 rounded ${c.bg} ${c.text} overflow-hidden px-1 text-left text-[10px] leading-tight opacity-90`}
            style={{ top: `${top}%`, height: `${Math.max(bottom - top, 0.6)}%` }}
          >
            {wide && bottom - top > 3 ? `${labelFor(e)} ${fmtTime(e.startTime)}` : ""}
          </button>
        );
      })}
      {data.points.map((e) => {
        const c = colorFor(e);
        return (
          <button
            key={e.id}
            onClick={() => onEdit(e)}
            className={`absolute left-1/2 -translate-x-1/2 ${POINT_SHAPE[e.type]} ${c.bg} ring-2 ring-slate-950`}
            style={{ top: `${pct(e.startTime)}%` }}
            title={`${labelFor(e)} ${fmtTime(e.startTime)}`}
          />
        );
      })}
    </div>
  );
}

export function CalendarView({ entries, onEdit }: { entries: Entry[]; onEdit: (e: Entry) => void }) {
  const [mode, setMode] = useState<"day" | "week">("day");
  const [anchor, setAnchor] = useState(() => startOfDay(Date.now()));

  // Keeps "today" honest if the calendar is left open across midnight.
  useTick(60_000);
  const today = startOfDay(Date.now());

  const step = mode === "day" ? DAY_MS : DAY_MS * 7;

  // The previous and next day/week are rendered either side of the current
  // one so a swipe can drag them into view under the finger, rather than the
  // date jumping the instant the gesture is recognised.
  const pages = useMemo(
    () => [-1, 0, 1].map((offset) => daysFor(anchor + offset * step, mode)),
    [anchor, step, mode],
  );

  // Whether today is already on screen — in week mode that's anywhere in the
  // visible week. Compared as whole days so a clock change can't make a week
  // built from fixed-length days miss it by an hour.
  const shown = daysFor(anchor, mode);
  const showingToday = today >= startOfDay(shown[0]) && today <= startOfDay(shown[shown.length - 1]);

  const gridRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const animatingRef = useRef(false);

  /** Animates to the adjacent day/week, then makes it the current one. */
  function slide(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track || animatingRef.current) return;
    animatingRef.current = true;

    track.style.transition = `transform ${SLIDE_MS}ms ${SLIDE_EASE}`;
    track.style.transform = `translateX(${direction === 1 ? "-66.6667%" : "0%"})`;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      // Move the anchor and recentre the track in a single commit —
      // flushSync so the new page is in the DOM before the transform is
      // reset, otherwise the browser paints one frame of the wrong day.
      flushSync(() => setAnchor((a) => a + direction * step));
      track.style.transition = "";
      track.style.transform = TRACK_CENTRED;
      animatingRef.current = false;
    };
    track.addEventListener("transitionend", finish, { once: true });
    // transitionend doesn't fire if the transition never actually runs (a
    // backgrounded tab, reduced-motion overrides) — never leave the track
    // stuck off-centre.
    window.setTimeout(finish, SLIDE_MS + 100);
  }
  const slideRef = useRef(slide);
  slideRef.current = slide;

  // Horizontal swipe is driven manually (touch-action is pan-y) so vertical
  // scrolling of the page stays fully native, and only a gesture that's
  // confidently horizontal past a small threshold starts dragging — a touch
  // that lands on an entry block still scrolls the page normally.
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0; // px/ms of finger movement, most recent sample
    let axis: "x" | "y" | null = null;

    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      startX = lastX = t.clientX;
      startY = t.clientY;
      lastT = e.timeStamp;
      velocity = 0;
      // Ignore a touch that starts mid-animation rather than fighting it for
      // control of the same transform.
      axis = animatingRef.current ? "y" : null;
    }

    function onTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      if (axis === null) {
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (Math.abs(dx) < SWIPE_AXIS_THRESHOLD && Math.abs(dy) < SWIPE_AXIS_THRESHOLD) return;
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (axis !== "x") return;

      e.preventDefault();
      const track = trackRef.current;
      if (track) {
        track.style.transition = "";
        track.style.transform = `translateX(calc(${TRACK_CENTRED_PCT}% + ${t.clientX - startX}px))`;
      }
      const dt = Math.max(1, e.timeStamp - lastT);
      velocity = (t.clientX - lastX) / dt;
      lastX = t.clientX;
      lastT = e.timeStamp;
    }

    function onTouchEnd(e: TouchEvent) {
      if (axis === "x") {
        const dx = e.changedTouches[0].clientX - startX;
        const width = viewportRef.current?.clientWidth || 1;
        const flicked = Math.abs(velocity) > SWIPE_VELOCITY_PX_PER_MS;
        // A flick decides direction by the flick itself, not by total
        // distance — they can disagree if the finger reversed at the end.
        const direction = (flicked ? -Math.sign(velocity) : -Math.sign(dx)) as 1 | -1;
        if (dx !== 0 && (Math.abs(dx) / width > SWIPE_DISTANCE_FRACTION || flicked)) {
          slideRef.current(direction);
        } else {
          // Not far enough — ease back to where it started.
          const track = trackRef.current;
          if (track) {
            track.style.transition = `transform ${SLIDE_MS}ms ${SLIDE_EASE}`;
            track.style.transform = TRACK_CENTRED;
          }
        }
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
    <div className="flex flex-col px-4 pb-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-slate-700">
            {(["day", "week"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-sm capitalize ${mode === m ? "bg-slate-700 text-white" : "text-slate-400"}`}
              >
                {m}
              </button>
            ))}
          </div>
          {/* Dimmed rather than hidden when today is already on screen, so the
              header doesn't reflow every time you swipe onto or off today. */}
          <button
            onClick={() => setAnchor(startOfDay(Date.now()))}
            className={`rounded-lg border border-slate-700 px-3 py-1.5 text-sm ${
              showingToday ? "text-slate-600" : "text-slate-300"
            }`}
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => slide(-1)} aria-label="Previous">
            <ChevronLeft className="h-5 w-5 text-slate-400" />
          </button>
          <span className="min-w-24 text-center text-sm text-slate-300">
            {new Date(anchor).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
          <button onClick={() => slide(1)} aria-label="Next">
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </button>
        </div>
      </div>

      <div ref={gridRef} className="flex rounded-xl bg-slate-900/50" style={{ touchAction: "pan-y" }}>
        {/* Outside the sliding viewport — the hours are the same on every
            day, so sliding them along with the columns just adds motion
            that carries no information. */}
        <div className="flex w-8 shrink-0 flex-col text-right">
          {HOUR_LABELS.filter((h) => h % 3 === 0).map((h) => (
            <div key={h} className="relative h-[calc(100%/8)] text-[10px] text-slate-500" style={{ height: 720 / 8 }}>
              <span className="absolute -top-1.5 right-1">{h}:00</span>
            </div>
          ))}
        </div>
        <div ref={viewportRef} className="flex-1 overflow-hidden">
          <div ref={trackRef} className="flex" style={{ width: "300%", transform: TRACK_CENTRED }}>
            {pages.map((days) => (
              <div key={days[0]} className="flex w-1/3 shrink-0" style={{ height: 720 }}>
                {days.map((d) => (
                  <Column key={d} data={dayColumn(entries, d)} wide={mode === "day"} onEdit={onEdit} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
        <Legend color="bg-indigo-400" label="Nap" />
        <Legend color="bg-indigo-800" label="Overnight" />
        <Legend color="bg-amber-400" label="Awake" />
        <Legend color="bg-emerald-300" label="Bottle" />
        <Legend color="bg-emerald-700" label="Boob" />
        <Legend color="bg-sky-300" label="Wet" type="diaper" />
        <Legend color="bg-amber-700" label="Poopy" type="diaper" />
        <Legend color="bg-red-300" label="Vitamin D" type="supplement" />
        <Legend color="bg-red-800" label="Iron" type="supplement" />
        <Legend color="bg-fuchsia-500" label="Butt" type="bath" />
        <Legend color="bg-fuchsia-300" label="Body" type="bath" />
        <Legend color="bg-fuchsia-800" label="Hair" type="bath" />
      </div>
    </div>
  );
}

// `type` mirrors the mark's shape on the grid, so the legend is what makes
// square and diamond readable rather than just decorative. Range types have
// no point-shape and fall back to the plain dot.
function Legend({ color, label, type }: { color: string; label: string; type?: Entry["type"] }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`${(type && POINT_SHAPE[type]) ?? "h-2.5 w-2.5 rounded-full"} shrink-0 ${color}`} />
      {label}
    </span>
  );
}
