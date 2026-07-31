"use client";

import { useEffect, useState } from "react";
import styles from "./CartView.module.css";

export default function FullscreenButton() {
  // iOS Safari has no Fullscreen API for arbitrary pages -- rendering
  // nothing there instead of a button that would just silently fail.
  const [supported, setSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setSupported(document.fullscreenEnabled);

    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
    };
  }, []);

  if (!supported) return null;

  const toggle = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <button className={styles.cartBadge} onClick={toggle}>
      {isFullscreen ? "🡼 Salir" : "⛶ Pantalla completa"}
    </button>
  );
}
