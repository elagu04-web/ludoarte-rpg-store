"use client";

import { useEffect, useState } from "react";
import { eventBus } from "@/game/eventBus";
import styles from "./GameOverlay.module.css";

export default function OrderPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleProximity = (near: boolean) => {
      setVisible(near);
    };

    eventBus.on("order-proximity", handleProximity);
    return () => {
      eventBus.off("order-proximity", handleProximity);
    };
  }, []);

  if (!visible) return null;

  return <div className={styles.prompt}>Presiona E para hacer un pedido</div>;
}
