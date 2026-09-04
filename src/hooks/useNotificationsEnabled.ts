import { useEffect, useState } from "react";
import { subscribeNotificationsEnabled } from "@/lib/settings";

export function useNotificationsEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(
    () =>
      subscribeNotificationsEnabled(
        (v) => setEnabled(v),
        () => {},
      ),
    [],
  );

  return enabled;
}
