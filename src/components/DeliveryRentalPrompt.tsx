"use client";

import { useEffect, useState } from "react";
import { eventBus } from "@/game/eventBus";
import styles from "./GameOverlay.module.css";

export default function DeliveryRentalPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleProximity = (near: boolean) => {
      setVisible(near);
    };

    eventBus.on("rental-delivery-proximity", handleProximity);
    return () => {
      eventBus.off("rental-delivery-proximity", handleProximity);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.prompt}>Presiona E para ver el alquiler a domicilio</div>
  );
}
