"use client";

import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { createGameConfig } from "@/game/config";
import { eventBus } from "@/game/eventBus";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import ShelfPrompt from "./ShelfPrompt";
import ScreenPrompt from "./ScreenPrompt";
import CounterPrompt from "./CounterPrompt";
import OrderPrompt from "./OrderPrompt";
import OrderTruckPrompt from "./OrderTruckPrompt";
import TvPrompt from "./TvPrompt";
import RentalPrompt from "./RentalPrompt";
import ActivityPrompt from "./ActivityPrompt";
import ShopMenu from "./ShopMenu";
import GameDialogueBox from "./GameDialogueBox";
import GameVideoPopup from "./GameVideoPopup";
import TvMenu from "./TvMenu";
import RentalMenu from "./RentalMenu";
import ActivityInfoScreen from "./ActivityInfoScreen";
import TouchControls from "./TouchControls";
import MobileCloseButton from "./MobileCloseButton";
import styles from "./GameOverlay.module.css";

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [isBackgroundBlurred, setIsBackgroundBlurred] = useState(false);
  const { user } = useAuth();
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

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

  useEffect(() => {
    const handleMonsterDefeated = () => {
      if (!userIdRef.current) return;
      createClient()
        .rpc("increment_monsters_defeated")
        .then(({ error }) => {
          if (error) console.error("[monster-defeated] rpc failed:", error);
        });
    };
    eventBus.on("monster-defeated", handleMonsterDefeated);
    return () => {
      eventBus.off("monster-defeated", handleMonsterDefeated);
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
      <RentalPrompt />
      <ActivityPrompt />
      <ShopMenu />
      <GameDialogueBox />
      <GameVideoPopup />
      <TvMenu />
      <RentalMenu />
      <ActivityInfoScreen />
      <TouchControls />
      <MobileCloseButton />
    </div>
  );
}
