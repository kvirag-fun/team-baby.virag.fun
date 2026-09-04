import { subscribeAvatar } from "@/lib/settings";
import { useSubscription } from "./useSubscription";

export function useAvatar() {
  return useSubscription(subscribeAvatar, "").value;
}
