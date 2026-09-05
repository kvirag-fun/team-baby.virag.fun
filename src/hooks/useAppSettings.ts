import { NO_APP_SETTINGS, subscribeAppSettings } from "@/lib/settings";
import { useSubscription } from "./useSubscription";

/** The one subscription to settings/app. Call it once, high up, and pass the
 * pieces down — calling it from two components would put two listeners back on
 * the same document, which is what this replaced. */
export function useAppSettings() {
  return useSubscription(subscribeAppSettings, NO_APP_SETTINGS).value;
}
