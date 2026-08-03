"use client";

import { useEffect, useRef, useState } from "react";
import { playMenuMoveSound, playMenuConfirmSound } from "@/game/music";
import styles from "./StartScreen.module.css";

// The menu doesn't wait for the whole rise animation to finish -- that
// made it feel like a long dead wait before you could do anything, even
// though the logo keeps gently settling into place a bit longer.
const MENU_REVEAL_MS = 1800;

interface MenuItem {
  id: "historia" | "tienda";
  label: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: "historia", label: "Modo Historia" },
  { id: "tienda", label: "Modo Tienda" },
];

const TICKER_TEXT =
  "Tienda de Juegos de Mesa — Abierto de martes a domingo en Épico Atlántida, calle 20 entre 11 y 1 — ";

export default function StartScreen({ onStart }: { onStart: () => void }) {
  const [risen, setRisen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [tiendaMessage, setTiendaMessage] = useState(false);

  const selectedIndexRef = useRef(0);
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    const riseTimer = setTimeout(() => setRisen(true), 50);
    const menuTimer = setTimeout(() => setShowMenu(true), MENU_REVEAL_MS);
    return () => {
      clearTimeout(riseTimer);
      clearTimeout(menuTimer);
    };
  }, []);

  useEffect(() => {
    if (!showMenu) return;

    const confirmSelection = () => {
      const item = MENU_ITEMS[selectedIndexRef.current];
      playMenuConfirmSound();
      if (item.id === "historia") {
        onStart();
      } else {
        setTiendaMessage(true);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (tiendaMessage) {
        if (event.key === "Escape" || event.key === "e" || event.key === "E" || event.key === "Enter") {
          setTiendaMessage(false);
        }
        return;
      }

      if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
        setSelectedIndex((prev) => (prev - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
        playMenuMoveSound();
      } else if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
        setSelectedIndex((prev) => (prev + 1) % MENU_ITEMS.length);
        playMenuMoveSound();
      } else if (event.key === "e" || event.key === "E" || event.key === "Enter") {
        confirmSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showMenu, tiendaMessage, onStart]);

  const selectItem = (item: MenuItem, index: number) => {
    if (index !== selectedIndexRef.current) playMenuMoveSound();
    setSelectedIndex(index);
  };

  const confirmItem = (item: MenuItem) => {
    playMenuConfirmSound();
    if (item.id === "historia") {
      onStart();
    } else {
      setTiendaMessage(true);
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.background} />
      <div className={`${styles.darkOverlay} ${risen ? styles.darkOverlayOn : ""}`} />

      <div className={`${styles.logoWrapper} ${risen ? styles.logoWrapperRisen : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- plain <img>
            on purpose: Next's optimizer caches a transformed copy keyed by
            the source path, so swapping this file in place (which is how
            this logo gets updated) kept serving the old cached version. */}
        <img src="/assets/logo.png" alt="Ludoarte" className={styles.logo} />
      </div>

      {showMenu && (
        <div className={styles.menu}>
          <ul className={styles.menuList}>
            {MENU_ITEMS.map((item, index) => (
              <li
                key={item.id}
                className={
                  index === selectedIndex ? styles.menuItemSelected : styles.menuItem
                }
                onClick={() => selectItem(item, index)}
                onDoubleClick={() => confirmItem(item)}
              >
                {index === selectedIndex ? "▶ " : "  "}
                {item.label}
              </li>
            ))}
          </ul>
          <p className={styles.menuHint}>FLECHAS: ELEGIR &middot; E: CONFIRMAR</p>
        </div>
      )}

      {tiendaMessage && (
        <div className={styles.tiendaMessage} onClick={() => setTiendaMessage(false)}>
          <p>Modo Tienda: proximamente.</p>
          <p className={styles.tiendaMessageHint}>E o ESC para volver</p>
        </div>
      )}

      <div className={styles.ticker}>
        <div className={styles.tickerTrack}>
          <span>{TICKER_TEXT}</span>
          <span>{TICKER_TEXT}</span>
        </div>
      </div>
    </div>
  );
}
