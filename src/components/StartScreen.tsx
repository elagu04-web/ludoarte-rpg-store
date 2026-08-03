"use client";

import { useEffect, useRef, useState } from "react";
import { playMenuMoveSound, playMenuConfirmSound } from "@/game/music";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { gameState } from "@/game/gameState";
import CharacterSelectScreen from "./CharacterSelectScreen";
import styles from "./StartScreen.module.css";

const CHARACTER_TINT_KEY = "ludoarte-character-tint";

// The menu doesn't wait for the whole rise animation to finish -- that
// made it feel like a long dead wait before you could do anything, even
// though the logo keeps gently settling into place a bit longer.
const MENU_REVEAL_MS = 1800;

interface MenuItem {
  id: "historia" | "tienda" | "personaje";
  label: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: "historia", label: "Modo Historia" },
  { id: "tienda", label: "Modo Tienda" },
  { id: "personaje", label: "Elegir Personaje" },
];

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

  const [tintChecked, setTintChecked] = useState(false);
  const [hasChosenCharacter, setHasChosenCharacter] = useState(false);
  const [characterMenuOpen, setCharacterMenuOpen] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const saved = localStorage.getItem(CHARACTER_TINT_KEY);
      if (saved) {
        gameState.playerTint = Number(saved);
        setHasChosenCharacter(true);
      } else {
        setHasChosenCharacter(false);
      }
      setTintChecked(true);
      return;
    }

    const savedLocal = localStorage.getItem(CHARACTER_TINT_KEY);

    let cancelled = false;
    createClient()
      .from("profiles")
      .select("character_tint")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.character_tint != null) {
          gameState.playerTint = data.character_tint;
          setHasChosenCharacter(true);
        } else if (savedLocal) {
          // Chosen before this account had a profiles row (or while
          // logged out) -- honor it instead of asking again, and copy
          // it up to the account so it's there next time.
          const tint = Number(savedLocal);
          gameState.playerTint = tint;
          setHasChosenCharacter(true);
          createClient()
            .from("profiles")
            .upsert({ id: user.id, email: user.email, character_tint: tint });
        } else {
          setHasChosenCharacter(false);
        }
        setTintChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const forcedCharacterSelect =
    !loading && !!user && tintChecked && !hasChosenCharacter;
  const showCharacterSelect = forcedCharacterSelect || characterMenuOpen;

  const handleSignOut = () => {
    // The tint cache is per-browser, not per-account -- without this,
    // logging out would keep showing the just-logged-out account's
    // chosen color as if it belonged to whoever uses this browser next.
    localStorage.removeItem(CHARACTER_TINT_KEY);
    gameState.playerTint = 0xffffff;
    setHasChosenCharacter(false);
    signOut();
  };

  const confirmCharacter = (tint: number) => {
    gameState.playerTint = tint;
    setHasChosenCharacter(true);
    setCharacterMenuOpen(false);
    localStorage.setItem(CHARACTER_TINT_KEY, String(tint));
    if (user) {
      createClient()
        .from("profiles")
        .upsert({ id: user.id, email: user.email, character_tint: tint });
    }
  };

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
    if (!showMenu || showCharacterSelect) return;

    const runAction = (item: MenuItem) => {
      if (item.id === "historia") {
        onStart();
      } else if (item.id === "tienda") {
        onTienda();
      } else if (item.id === "personaje" && user) {
        setCharacterMenuOpen(true);
      }
    };

    const confirmSelection = () => {
      const item = MENU_ITEMS[selectedIndexRef.current];
      if (!item) return;
      playMenuConfirmSound();
      runAction(item);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
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
  }, [showMenu, showCharacterSelect, onStart, onTienda, user]);

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
    } else if (item.id === "personaje" && user) {
      setCharacterMenuOpen(true);
    }
  };

  if (showCharacterSelect) {
    return (
      <CharacterSelectScreen
        onConfirm={confirmCharacter}
        onCancel={forcedCharacterSelect ? undefined : () => setCharacterMenuOpen(false)}
      />
    );
  }

  return (
    <div className={styles.screen}>
      <div className={styles.background} />
      <div className={`${styles.darkOverlay} ${risen ? styles.darkOverlayOn : ""}`} />

      {!loading && (
        <div className={styles.authCorner}>
          {user ? (
            <button className={styles.authButton} onClick={handleSignOut}>
              Cerrar sesion ({user.email})
            </button>
          ) : (
            <button className={styles.authButton} onClick={signInWithGoogle}>
              Iniciar sesion con Google
            </button>
          )}
        </div>
      )}

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

      <div className={styles.ticker}>
        <div className={styles.tickerTrack}>
          <span>{TICKER_TEXT}</span>
          <span>{TICKER_TEXT}</span>
        </div>
      </div>
    </div>
  );
}
