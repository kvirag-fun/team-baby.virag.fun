import { subscribeEntries } from "@/lib/entries";
import { useSubscription } from "./useSubscription";
import type { Entry } from "@/lib/types";

const NONE: Entry[] = [];

export function useEntries() {
  const { value: entries, loading, error } = useSubscription(subscribeEntries, NONE);
  return { entries, loading, error };
}
