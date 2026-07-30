"use client";

import { useEffect, useState } from "react";
import { eventBus } from "@/game/eventBus";
import styles from "./GameOverlay.module.css";

export default function RentalPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleProximity = (near: boolean) => {
      setVisible(near);
    };

    eventBus.on("rental-proximity", handleProximity);
    return () => {
      eventBus.off("rental-proximity", handleProximity);
    };
  }, []);

  if (!visible) return null;

  return <div className={styles.prompt}>Presiona E para ver el alquiler</div>;
}
