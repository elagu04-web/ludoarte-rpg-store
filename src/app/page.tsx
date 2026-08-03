"use client";

import { useState } from "react";
import styles from "./page.module.css";
import GameLoader from "@/components/GameLoader";
import CartBadge from "@/components/CartBadge";
import CartViewLoader from "@/components/CartViewLoader";
import SearchScreenLoader from "@/components/SearchScreenLoader";
import OrderTruckScreenLoader from "@/components/OrderTruckScreenLoader";
import MusicController from "@/components/MusicController";
import FullscreenButton from "@/components/FullscreenButton";
import StartScreen from "@/components/StartScreen";
import { CartProvider } from "@/context/CartContext";

export default function Home() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return <StartScreen onStart={() => setStarted(true)} />;
  }

  return (
    <CartProvider>
      <div className={styles.page}>
        <main className={styles.main}>
          <h1>Ludoarte RPG Store</h1>
          <div className={styles.headerRow}>
            <CartBadge />
            <MusicController />
            <FullscreenButton />
          </div>
          <GameLoader />
        </main>
      </div>
      <div className={styles.rotateOverlay}>
        <span className={styles.rotateIcon}>📱↻</span>
        <p>Gira tu telefono para jugar</p>
      </div>
      <CartViewLoader />
      <SearchScreenLoader />
      <OrderTruckScreenLoader />
    </CartProvider>
  );
}
