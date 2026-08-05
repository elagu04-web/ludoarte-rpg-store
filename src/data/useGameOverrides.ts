"use client";

import { useEffect, useState } from "react";
import {
  fetchGameOverrides,
  subscribeGameOverrides,
  type GameOverrides,
} from "./gameOverrides";

/** null while the first fetch is in flight. */
export function useGameOverrides(): GameOverrides | null {
  const [overrides, setOverrides] = useState<GameOverrides | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchGameOverrides().then((map) => {
      if (!cancelled) setOverrides(map);
    });
    const unsubscribe = subscribeGameOverrides((map) => {
      if (!cancelled) setOverrides(new Map(map));
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return overrides;
}
