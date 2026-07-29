"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Phaser from "phaser";
import { createGameConfig } from "@/game/config";
import { eventBus } from "@/game/eventBus";
import ShelfPrompt from "./ShelfPrompt";
import ScreenPrompt from "./ScreenPrompt";
import CounterPrompt from "./CounterPrompt";
import OrderPrompt from "./OrderPrompt";
import ShopMenu from "./ShopMenu";
import TouchControls from "./TouchControls";
import styles from "./GameOverlay.module.css";

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [aspect, setAspect] = useState(1536 / 1024);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    gameRef.current = new Phaser.Game(createGameConfig(containerRef.current));

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleSceneResized = ({
      width,
      height,
    }: {
      width: number;
      height: number;
    }) => {
      setAspect(width / height);
    };
    eventBus.on("scene-resized", handleSceneResized);
    return () => {
      eventBus.off("scene-resized", handleSceneResized);
    };
  }, []);

  return (
    <div
      className={styles.gameWrapper}
      style={{ "--aspect": aspect } as CSSProperties}
    >
      <div ref={containerRef} className={styles.canvasHost} />
      <ShelfPrompt />
      <ScreenPrompt />
      <CounterPrompt />
      <OrderPrompt />
      <ShopMenu />
      <TouchControls />
    </div>
  );
}
