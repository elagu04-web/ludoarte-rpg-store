"use client";

import { useEffect, useState } from "react";
import { eventBus } from "@/game/eventBus";
import styles from "./GameOverlay.module.css";

export default function ActivityPrompt() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const handleProximity = (title: string | null) => setLabel(title);
    eventBus.on("activity-proximity", handleProximity);
    return () => {
      eventBus.off("activity-proximity", handleProximity);
    };
  }, []);

  if (!label) return null;

  return <div className={styles.prompt}>Presiona E para ver {label}</div>;
}
