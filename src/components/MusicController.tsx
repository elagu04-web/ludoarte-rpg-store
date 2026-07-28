"use client";

import { useEffect, useState } from "react";
import { startMusic, toggleMusic } from "@/game/music";
import styles from "./CartView.module.css";

export default function MusicController() {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const handleFirstInteraction = () => {
      startMusic();
      setPlaying(true);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("pointerdown", handleFirstInteraction);
    };

    window.addEventListener("keydown", handleFirstInteraction);
    window.addEventListener("pointerdown", handleFirstInteraction);

    return () => {
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("pointerdown", handleFirstInteraction);
    };
  }, []);

  return (
    <button
      className={styles.cartBadge}
      onClick={() => setPlaying(toggleMusic())}
    >
      {playing ? "🔊 Música" : "🔇 Música"}
    </button>
  );
}
