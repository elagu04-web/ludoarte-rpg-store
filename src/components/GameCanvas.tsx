"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createGameConfig } from "@/game/config";
import ShelfPrompt from "./ShelfPrompt";
import GameModal from "./GameModal";
import styles from "./GameOverlay.module.css";

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    gameRef.current = new Phaser.Game(createGameConfig(containerRef.current));

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div className={styles.gameWrapper}>
      <div ref={containerRef} className={styles.canvasHost} />
      <ShelfPrompt />
      <GameModal />
    </div>
  );
}
