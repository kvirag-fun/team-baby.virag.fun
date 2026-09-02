import { useEffect, useState } from "react";
import { subscribeBabyName } from "@/lib/settings";

export function useBabyName() {
  const [babyName, setBabyNameState] = useState("");

  useEffect(
    () =>
      subscribeBabyName(
        (name) => setBabyNameState(name),
        () => {},
      ),
    [],
  );

  return babyName;
}
