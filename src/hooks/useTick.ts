import { useEffect, useState } from "react";

/** Forces a re-render every intervalMs, so "elapsed since X" text stays live. */
export function useTick(intervalMs = 30_000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
