"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createGameConfig } from "@/game/config";
import ShelfPrompt from "./ShelfPrompt";
import ScreenPrompt from "./ScreenPrompt";
import CounterPrompt from "./CounterPrompt";
import OrderPrompt from "./OrderPrompt";
import OrderTruckPrompt from "./OrderTruckPrompt";
import ShopMenu from "./ShopMenu";
import GameDialogueBox from "./GameDialogueBox";
import TouchControls from "./TouchControls";
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
      <ScreenPrompt />
      <CounterPrompt />
      <OrderPrompt />
      <OrderTruckPrompt />
      <ShopMenu />
      <GameDialogueBox />
      <TouchControls />
    </div>
  );
}
