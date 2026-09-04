import { useEffect, useState } from "react";
import { subscribeAvatar } from "@/lib/settings";

export function useAvatar() {
  const [avatar, setAvatarState] = useState("");

  useEffect(
    () =>
      subscribeAvatar(
        (dataUrl) => setAvatarState(dataUrl),
        () => {},
      ),
    [],
  );

  return avatar;
}
