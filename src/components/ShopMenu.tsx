"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { eventBus } from "@/game/eventBus";
import { shelves } from "@/data/shelves";
import { useCart } from "@/context/CartContext";
import styles from "./GameOverlay.module.css";

export default function ShopMenu() {
  const [openShelfId, setOpenShelfId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { addItem } = useCart();

  const shelf = shelves.find((item) => item.id === openShelfId) ?? null;
  const selectedIndexRef = useRef(0);
  const gamesRef = useRef(shelf?.games ?? []);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    gamesRef.current = shelf?.games ?? [];
  }, [shelf]);

  useEffect(() => {
    const handleOpen = (shelfId: string) => {
      setOpenShelfId(shelfId);
      setSelectedIndex(0);
    };
    eventBus.on("shelf-open", handleOpen);
    return () => {
      eventBus.off("shelf-open", handleOpen);
    };
  }, []);

  useEffect(() => {
    eventBus.emit("menu-open", !!shelf);
  }, [shelf]);

  const close = () => setOpenShelfId(null);

  useEffect(() => {
    if (!shelf) return;

    const moveSelection = (delta: number) => {
      setSelectedIndex((prev) => {
        const count = gamesRef.current.length;
        return (prev + delta + count) % count;
      });
    };

    const confirmSelection = () => {
      const game = gamesRef.current[selectedIndexRef.current];
      if (game) addItem(game);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
        moveSelection(-1);
      } else if (
        event.key === "ArrowDown" ||
        event.key === "s" ||
        event.key === "S"
      ) {
        moveSelection(1);
      } else if (event.key === "e" || event.key === "E" || event.key === "Enter") {
        confirmSelection();
      } else if (event.key === "Escape") {
        close();
      }
    };

    const handleTouchDirection = (payload: {
      direction: "up" | "down" | "left" | "right";
      pressed: boolean;
    }) => {
      if (!payload.pressed) return;
      if (payload.direction === "up") moveSelection(-1);
      if (payload.direction === "down") moveSelection(1);
    };

    const handleTouchInteract = () => confirmSelection();

    window.addEventListener("keydown", handleKeyDown);
    eventBus.on("touch-direction", handleTouchDirection);
    eventBus.on("touch-interact", handleTouchInteract);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      eventBus.off("touch-direction", handleTouchDirection);
      eventBus.off("touch-interact", handleTouchInteract);
    };
  }, [shelf, addItem]);

  if (!shelf) return null;

  const selectedGame = shelf.games[selectedIndex];

  return (
    <>
      <div className={styles.spinningBoxWrapper}>
        <div className={styles.spinningBox} key={selectedGame.id}>
          <Image
            src={selectedGame.image}
            alt={selectedGame.name}
            width={140}
            height={140}
          />
        </div>
      </div>

      <div className={styles.shopMenu}>
        <div className={styles.shopMenuTitle}>
          <span>{shelf.title}</span>
          <button className={styles.shopMenuClose} onClick={close}>
            ESC
          </button>
        </div>
        <ul className={styles.shopMenuList}>
          {shelf.games.map((game, index) => (
            <li
              key={game.id}
              className={
                index === selectedIndex
                  ? styles.shopMenuItemSelected
                  : styles.shopMenuItem
              }
            >
              {index === selectedIndex ? "▶ " : "  "}
              {game.name}
            </li>
          ))}
        </ul>
        <div className={styles.shopMenuFooter}>
          <div className={styles.shopMenuPrice}>${selectedGame.price}</div>
          <div className={styles.shopMenuHint}>E: Agregar &middot; ESC: Salir</div>
        </div>
      </div>
    </>
  );
}
