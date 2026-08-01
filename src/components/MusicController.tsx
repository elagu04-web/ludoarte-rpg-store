"use client";

import { useEffect, useState } from "react";
import { startMusic, stopMusic, toggleMusic, isMusicPlaying } from "@/game/music";
import styles from "./CartView.module.css";

export default function MusicController() {
  // Read the real playback state instead of assuming "off" -- the actual
  // on/off state lives in the music module (a plain singleton, not React
  // state), so if this component ever remounts while music is already
  // playing, starting from a hardcoded false would show "off" while the
  // song kept playing underneath, out of sync with the button.
  const [playing, setPlaying] = useState(isMusicPlaying);

  useEffect(() => {
    if (isMusicPlaying()) return;

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

  // Stop the actual audio when this component goes away instead of leaving
  // an orphaned scheduler running with no UI left to control it.
  useEffect(() => {
    return () => {
      stopMusic();
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
