"use client";

import { useEffect, useState } from "react";
import { eventBus } from "@/game/eventBus";
import styles from "./GameOverlay.module.css";

export default function CounterPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleProximity = (near: boolean) => {
      setVisible(near);
    };

    eventBus.on("counter-proximity", handleProximity);
    return () => {
      eventBus.off("counter-proximity", handleProximity);
    };
  }, []);

  if (!visible) return null;

  return <div className={styles.prompt}>Presiona E para pagar</div>;
}
