"use client";

import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { createGameConfig } from "@/game/config";
import { eventBus } from "@/game/eventBus";
import ShelfPrompt from "./ShelfPrompt";
import ScreenPrompt from "./ScreenPrompt";
import CounterPrompt from "./CounterPrompt";
import OrderPrompt from "./OrderPrompt";
import OrderTruckPrompt from "./OrderTruckPrompt";
import TvPrompt from "./TvPrompt";
import ShopMenu from "./ShopMenu";
import GameDialogueBox from "./GameDialogueBox";
import GameVideoPopup from "./GameVideoPopup";
import TvMenu from "./TvMenu";
import TouchControls from "./TouchControls";
import styles from "./GameOverlay.module.css";

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [isBackgroundBlurred, setIsBackgroundBlurred] = useState(false);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    gameRef.current = new Phaser.Game(createGameConfig(containerRef.current));

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleBlur = (blurred: boolean) => setIsBackgroundBlurred(blurred);
    eventBus.on("background-blur", handleBlur);
    return () => {
      eventBus.off("background-blur", handleBlur);
    };
  }, []);

  return (
    <div className={styles.gameWrapper}>
      <div
        ref={containerRef}
        className={
          isBackgroundBlurred
            ? `${styles.canvasHost} ${styles.canvasHostBlurred}`
            : styles.canvasHost
        }
      />
      <ShelfPrompt />
      <ScreenPrompt />
      <CounterPrompt />
      <OrderPrompt />
      <OrderTruckPrompt />
      <TvPrompt />
      <ShopMenu />
      <GameDialogueBox />
      <GameVideoPopup />
      <TvMenu />
      <TouchControls />
    </div>
  );
}
