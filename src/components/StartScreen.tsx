"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { playMenuMoveSound, playMenuConfirmSound } from "@/game/music";
import { useAuth } from "@/context/AuthContext";
import styles from "./StartScreen.module.css";

// The menu doesn't wait for the whole rise animation to finish -- that
// made it feel like a long dead wait before you could do anything, even
// though the logo keeps gently settling into place a bit longer.
const MENU_REVEAL_MS = 1800;

interface MenuItem {
  id: "historia" | "tienda" | "login" | "logout";
  label: string;
}

const TICKER_TEXT =
  "Tienda de Juegos de Mesa — Abierto de martes a domingo en Épico Atlántida, calle 20 entre 11 y 1 — ";

interface StartScreenProps {
  onStart: () => void;
  onTienda: () => void;
}

export default function StartScreen({ onStart, onTienda }: StartScreenProps) {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [risen, setRisen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const menuItems = useMemo<MenuItem[]>(() => {
    const items: MenuItem[] = [
      { id: "historia", label: "Modo Historia" },
      { id: "tienda", label: "Modo Tienda" },
    ];
    if (!loading) {
      items.push(
        user
          ? { id: "logout", label: `Cerrar sesion (${user.email})` }
          : { id: "login", label: "Iniciar sesion con Google" }
      );
    }
    return items;
  }, [user, loading]);

  const selectedIndexRef = useRef(0);
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    if (selectedIndex >= menuItems.length) {
      setSelectedIndex(0);
    }
  }, [menuItems, selectedIndex]);

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

    const runAction = (item: MenuItem) => {
      if (item.id === "historia") {
        onStart();
      } else if (item.id === "tienda") {
        onTienda();
      } else if (item.id === "login") {
        signInWithGoogle();
      } else if (item.id === "logout") {
        signOut();
      }
    };

    const confirmSelection = () => {
      const item = menuItems[selectedIndexRef.current];
      if (!item) return;
      playMenuConfirmSound();
      runAction(item);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
        setSelectedIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
        playMenuMoveSound();
      } else if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
        setSelectedIndex((prev) => (prev + 1) % menuItems.length);
        playMenuMoveSound();
      } else if (event.key === "e" || event.key === "E" || event.key === "Enter") {
        confirmSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showMenu, onStart, onTienda, menuItems, signInWithGoogle, signOut]);

  const selectItem = (item: MenuItem, index: number) => {
    if (index !== selectedIndexRef.current) playMenuMoveSound();
    setSelectedIndex(index);
  };

  const confirmItem = (item: MenuItem) => {
    playMenuConfirmSound();
    if (item.id === "historia") {
      onStart();
    } else if (item.id === "tienda") {
      onTienda();
    } else if (item.id === "login") {
      signInWithGoogle();
    } else if (item.id === "logout") {
      signOut();
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
            {menuItems.map((item, index) => (
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

      <div className={styles.ticker}>
        <div className={styles.tickerTrack}>
          <span>{TICKER_TEXT}</span>
          <span>{TICKER_TEXT}</span>
        </div>
      </div>
    </div>
  );
}
