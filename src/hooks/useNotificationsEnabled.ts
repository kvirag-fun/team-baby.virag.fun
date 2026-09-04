import { subscribeNotificationsEnabled } from "@/lib/settings";
import { useSubscription } from "./useSubscription";

export function useNotificationsEnabled() {
  return useSubscription(subscribeNotificationsEnabled, false).value;
}
