"use client";

import { useState } from "react";
import styles from "./page.module.css";
import GameLoader from "@/components/GameLoader";
import CartBadge from "@/components/CartBadge";
import CartViewLoader from "@/components/CartViewLoader";
import SearchScreenLoader from "@/components/SearchScreenLoader";
import OrderTruckScreenLoader from "@/components/OrderTruckScreenLoader";
import LoreScreenLoader from "@/components/LoreScreenLoader";
import MusicController from "@/components/MusicController";
import FullscreenButton from "@/components/FullscreenButton";
import StartScreen from "@/components/StartScreen";
import TiendaScreen from "@/components/TiendaScreen";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

type Mode = "start" | "historia" | "tienda";

export default function Home() {
  const [mode, setMode] = useState<Mode>("start");

  if (mode === "start") {
    return (
      <AuthProvider>
        <StartScreen
          onStart={() => setMode("historia")}
          onTienda={() => setMode("tienda")}
        />
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <CartProvider>
        {mode === "historia" && (
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
        )}
        {mode === "tienda" && (
          <TiendaScreen onExit={() => setMode("start")} />
        )}
        {mode === "historia" && (
          <div className={styles.rotateOverlay}>
            <span className={styles.rotateIcon}>📱↻</span>
            <p>Gira tu telefono para jugar</p>
          </div>
        )}
        <CartViewLoader />
        <SearchScreenLoader />
        <OrderTruckScreenLoader />
        <LoreScreenLoader />
      </CartProvider>
    </AuthProvider>
  );
}
