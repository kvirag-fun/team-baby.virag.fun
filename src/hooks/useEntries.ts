import { useEffect, useState } from "react";
import { subscribeEntries } from "@/lib/entries";
import type { Entry } from "@/lib/types";

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeEntries(
      (e) => {
        setEntries(e);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { entries, loading, error };
}
