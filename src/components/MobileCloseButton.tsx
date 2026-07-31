"use client";

import { useEffect, useState } from "react";
import { eventBus } from "@/game/eventBus";
import styles from "./GameOverlay.module.css";

/** A big, obvious close button for whichever menu is currently open --
 * every menu already closes itself on an Escape keydown, so this just
 * dispatches a real one instead of duplicating each menu's close logic.
 * Phones have no Escape key, and the small per-menu "ESC" buttons are
 * easy to miss/mis-tap on a touchscreen. */
export default function MobileCloseButton() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleMenuOpen = (open: boolean) => setMenuOpen(open);
    eventBus.on("menu-open", handleMenuOpen);
    return () => {
      eventBus.off("menu-open", handleMenuOpen);
    };
  }, []);

  if (!menuOpen) return null;

  const close = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  };

  return (
    <button className={styles.mobileCloseButton} onClick={close}>
      ✕
    </button>
  );
}
