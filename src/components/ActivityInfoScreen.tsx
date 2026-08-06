"use client";

import { useEffect, useState } from "react";
import { eventBus } from "@/game/eventBus";
import {
  playMenuOpenSound,
  playMenuCloseSound,
  playMenuConfirmSound,
} from "@/game/music";
import { findActivity } from "@/data/activities";
import styles from "./GameOverlay.module.css";

const STORE_WHATSAPP_NUMBER = "59899861116";

function buildActivityWhatsAppUrl(title: string): string {
  const message = `Hola! Quiero consultar por ${title}.`;
  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Info panel for the ground-floor activity tables (Ajedrez, Arte,
 * Arcilla, Eventos, Club del Puzzle, Membresia) -- everything except
 * Alquiler, which already has its own dedicated menu (RentalMenu). */
export default function ActivityInfoScreen() {
  const [activityId, setActivityId] = useState<string | null>(null);
  const activity = activityId ? findActivity(activityId) : undefined;

  useEffect(() => {
    const handleOpen = (id: string) => {
      setActivityId(id);
      playMenuOpenSound();
    };
    eventBus.on("activity-open", handleOpen);
    return () => {
      eventBus.off("activity-open", handleOpen);
    };
  }, []);

  useEffect(() => {
    eventBus.emit("menu-open", !!activity);
  }, [activity]);

  const close = () => {
    setActivityId(null);
    playMenuCloseSound();
  };

  useEffect(() => {
    if (!activity) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activity]);

  if (!activity) return null;

  return (
    <div className={`${styles.shopMenu} ${styles.activityMenuPanel}`}>
      <div className={styles.shopMenuTitle}>
        <span>{activity.title}</span>
        <button className={styles.shopMenuClose} onClick={close}>
          ESC
        </button>
      </div>

      <div className={styles.activityBody}>
        {activity.groups.map((group) => (
          <div key={group.label} className={styles.activityGroup}>
            <p className={styles.activityGroupLabel}>{group.label}</p>
            <p className={styles.activityGroupSchedule}>{group.schedule}</p>
          </div>
        ))}
        {activity.note && <p className={styles.activityNote}>{activity.note}</p>}
        {activity.priceLines.map((line) => (
          <p key={line} className={styles.activityPriceLine}>
            {line}
          </p>
        ))}
      </div>

      <div className={styles.shopMenuFooter}>
        <a
          className={styles.activityCtaButton}
          href={buildActivityWhatsAppUrl(activity.title)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => playMenuConfirmSound()}
        >
          {activity.cta} por WhatsApp
        </a>
        <span className={styles.shopMenuHint}>ESC: Salir</span>
      </div>
    </div>
  );
}
