"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { playMenuMoveSound, playMenuConfirmSound } from "@/game/music";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { gameState } from "@/game/gameState";
import CharacterSelectScreen from "./CharacterSelectScreen";
import AdminScreen from "./AdminScreen";
import InventoryScreen from "./InventoryScreen";
import OrdersScreen from "./OrdersScreen";
import styles from "./StartScreen.module.css";

const CHARACTER_TINT_KEY = "ludoarte-character-tint";
const ADMIN_EMAIL = "elagu04@gmail.com";

// The menu doesn't wait for the whole rise animation to finish -- that
// made it feel like a long dead wait before you could do anything, even
// though the logo keeps gently settling into place a bit longer.
const MENU_REVEAL_MS = 1800;

interface MenuItem {
  id: "historia" | "tienda" | "personaje" | "admin" | "inventario" | "pedidos";
  label: string;
}

const BASE_MENU_ITEMS: MenuItem[] = [
  { id: "historia", label: "Modo Historia" },
  { id: "tienda", label: "Modo Tienda" },
];
const PERSONAJE_ITEM: MenuItem = { id: "personaje", label: "Elegir Personaje" };
const ADMIN_ITEM: MenuItem = { id: "admin", label: "Panel Admin" };
const INVENTORY_ITEM: MenuItem = { id: "inventario", label: "Inventario" };
const ORDERS_ITEM: MenuItem = { id: "pedidos", label: "Pedidos" };

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
  const [adminOpen, setAdminOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const isAdmin = user?.email === ADMIN_EMAIL;

  const menuItems = useMemo(() => {
    if (!user) return BASE_MENU_ITEMS;
    return isAdmin
      ? [...BASE_MENU_ITEMS, PERSONAJE_ITEM, ADMIN_ITEM, INVENTORY_ITEM, ORDERS_ITEM]
      : [...BASE_MENU_ITEMS, PERSONAJE_ITEM];
  }, [user, isAdmin]);

  useEffect(() => {
    if (selectedIndex >= menuItems.length) setSelectedIndex(0);
  }, [menuItems.length, selectedIndex]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Logged out always means the standard color -- the browser's
      // cached tint (see below) is only ever a migration source for
      // logging back in, never something a guest should see.
      gameState.playerTint = 0xffffff;
      setHasChosenCharacter(false);
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
    // Note: hasChosenCharacter is deliberately left alone here -- setting
    // it false while `user` is still the old (truthy) value for one more
    // render would make forcedCharacterSelect true and flash the picker
    // open right before signOut() finishes. The [user, loading] effect
    // recomputes it correctly once `user` actually becomes null.
    localStorage.removeItem(CHARACTER_TINT_KEY);
    gameState.playerTint = 0xffffff;
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
    if (!showMenu || showCharacterSelect || adminOpen || inventoryOpen || ordersOpen) return;

    const runAction = (item: MenuItem) => {
      if (item.id === "historia") {
        onStart();
      } else if (item.id === "tienda") {
        onTienda();
      } else if (item.id === "personaje") {
        setCharacterMenuOpen(true);
      } else if (item.id === "admin") {
        setAdminOpen(true);
      } else if (item.id === "inventario") {
        setInventoryOpen(true);
      } else if (item.id === "pedidos") {
        setOrdersOpen(true);
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
  }, [
    showMenu,
    showCharacterSelect,
    adminOpen,
    inventoryOpen,
    ordersOpen,
    onStart,
    onTienda,
    menuItems,
  ]);

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
    } else if (item.id === "personaje") {
      setCharacterMenuOpen(true);
    } else if (item.id === "admin") {
      setAdminOpen(true);
    } else if (item.id === "inventario") {
      setInventoryOpen(true);
    } else if (item.id === "pedidos") {
      setOrdersOpen(true);
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

  if (adminOpen) {
    return <AdminScreen onExit={() => setAdminOpen(false)} />;
  }

  if (inventoryOpen) {
    return <InventoryScreen onExit={() => setInventoryOpen(false)} />;
  }

  if (ordersOpen) {
    return <OrdersScreen onExit={() => setOrdersOpen(false)} />;
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

      {/* Credito requerido por la licencia CC-BY-SA de la TV pixel-art de
          la fachada (Pixel Art TV Set, OpenGameArt.org). */}
      <a
        href="https://opengameart.org/content/pixel-art-tv-set"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.credit}
      >
        TV: OpenGameArt.org (CC BY-SA 3.0)
      </a>
    </div>
  );
}
