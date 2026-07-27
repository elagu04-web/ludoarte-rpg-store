"use client";

import { useEffect, useState } from "react";
import { eventBus } from "@/game/eventBus";
import styles from "./GameOverlay.module.css";

export default function ShelfPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleProximity = (shelfId: string | null) => {
      setVisible(shelfId !== null);
    };

    eventBus.on("shelf-proximity", handleProximity);
    return () => {
      eventBus.off("shelf-proximity", handleProximity);
    };
  }, []);

  if (!visible) return null;

  return <div className={styles.prompt}>Presiona E para explorar</div>;
}
