"use client";

import { useEffect, useState } from "react";
import {
  fetchCustomGames,
  subscribeCustomGames,
  type CustomGame,
} from "./customGames";

/** null while the first fetch is in flight. */
export function useCustomGames(): CustomGame[] | null {
  const [games, setGames] = useState<CustomGame[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCustomGames().then((rows) => {
      if (!cancelled) setGames(rows);
    });
    const unsubscribe = subscribeCustomGames((rows) => {
      if (!cancelled) setGames([...rows]);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return games;
}
