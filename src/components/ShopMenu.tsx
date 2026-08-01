"use client";

import { useEffect, useRef, useState } from "react";
import { eventBus } from "@/game/eventBus";
import {
  playMenuMoveSound,
  playMenuConfirmSound,
  playMenuOpenSound,
  playMenuCloseSound,
} from "@/game/music";
import { shelves } from "@/data/shelves";
import { useCart } from "@/context/CartContext";
import { buildGameDialogue } from "@/game/gameDialogue";
import SpinningBox from "./SpinningBox";
import styles from "./GameOverlay.module.css";

export default function ShopMenu() {
  const [openShelfId, setOpenShelfId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { addItem } = useCart();

  const shelf = shelves.find((item) => item.id === openShelfId) ?? null;
  const selectedGame = shelf?.games[selectedIndex];
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
      playMenuOpenSound();
    };
    eventBus.on("shelf-open", handleOpen);
    return () => {
      eventBus.off("shelf-open", handleOpen);
    };
  }, []);

  useEffect(() => {
    eventBus.emit("menu-open", !!shelf);
  }, [shelf]);

  useEffect(() => {
    eventBus.emit("game-dialogue", selectedGame ? buildGameDialogue(selectedGame) : "");
    eventBus.emit("game-video-open", null);
  }, [selectedGame]);

  const close = () => {
    setOpenShelfId(null);
    playMenuCloseSound();
    eventBus.emit("game-video-open", null);
  };

  useEffect(() => {
    if (!shelf) return;

    const moveSelection = (delta: number) => {
      setSelectedIndex((prev) => {
        const count = gamesRef.current.length;
        return (prev + delta + count) % count;
      });
      playMenuMoveSound();
    };

    const confirmSelection = () => {
      const game = gamesRef.current[selectedIndexRef.current];
      if (game && game.stock > 0) {
        addItem(game);
        playMenuConfirmSound();
      }
    };

    const openVideo = () => {
      const game = gamesRef.current[selectedIndexRef.current];
      if (game?.videoUrl) {
        eventBus.emit("game-video-open", game.videoUrl);
      }
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
      } else if (event.key === "v" || event.key === "V") {
        openVideo();
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

  if (!shelf || !selectedGame) return null;

  return (
    <>
      <div className={styles.spinningBoxWrapper}>
        <SpinningBox game={selectedGame} key={selectedGame.id} />
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
              onClick={() => {
                if (index !== selectedIndexRef.current) playMenuMoveSound();
                setSelectedIndex(index);
              }}
              onDoubleClick={() => {
                if (game.stock > 0) {
                  addItem(game);
                  playMenuConfirmSound();
                }
              }}
            >
              {index === selectedIndex ? "▶ " : "  "}
              {game.name}
            </li>
          ))}
        </ul>
        {selectedGame.videoUrl && (
          <button
            className={styles.shopMenuVideoButton}
            onClick={() =>
              eventBus.emit("game-video-open", selectedGame.videoUrl!)
            }
          >
            ▶ Ver video (V)
          </button>
        )}
        <div className={styles.shopMenuFooter}>
          <div className={styles.shopMenuPrice}>
            ${selectedGame.price}
            {selectedGame.stock === 0 && (
              <span className={styles.shopMenuOrderOnly}>
                {" "}
                &middot; Solo por pedido
              </span>
            )}
          </div>
          <div className={styles.shopMenuHint}>
            {selectedGame.stock > 0 ? "E: Agregar" : "Sin stock"} &middot; ESC:
            Salir
          </div>
        </div>
      </div>
    </>
  );
}
