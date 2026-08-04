"use client";

import { useEffect } from "react";
import { eventBus } from "@/game/eventBus";

export default function GameOverExitListener({ onExit }: { onExit: () => void }) {
  useEffect(() => {
    eventBus.on("game-over-end", onExit);
    return () => {
      eventBus.off("game-over-end", onExit);
    };
  }, [onExit]);

  return null;
}
