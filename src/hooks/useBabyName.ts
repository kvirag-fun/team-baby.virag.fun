import { subscribeBabyName } from "@/lib/settings";
import { useSubscription } from "./useSubscription";

export function useBabyName() {
  return useSubscription(subscribeBabyName, "").value;
}
