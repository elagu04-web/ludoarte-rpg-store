"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { eventBus } from "@/game/eventBus";
import {
  playMenuMoveSound,
  playMenuConfirmSound,
  playMenuOpenSound,
  playMenuCloseSound,
} from "@/game/music";
import { shelves, type BoardGame } from "@/data/shelves";
import { useCart } from "@/context/CartContext";
import styles from "./GameOverlay.module.css";

const SPIN_SHEET_DISPLAY_SCALE = 0.5;

function SpinningBox({ game }: { game: BoardGame }) {
  const { spinSheet } = game;

  if (spinSheet) {
    const displayWidth = spinSheet.frameWidth * SPIN_SHEET_DISPLAY_SCALE;
    const displayHeight = spinSheet.frameHeight * SPIN_SHEET_DISPLAY_SCALE;

    return (
      <div
        className={styles.spinSheetBox}
        style={
          {
            width: displayWidth,
            height: displayHeight,
            backgroundImage: `url(${spinSheet.path})`,
            backgroundSize: `${spinSheet.columns * displayWidth}px ${
              spinSheet.rows * displayHeight
            }px`,
            "--frame-w": `${displayWidth}px`,
            "--frame-h": `${displayHeight}px`,
          } as CSSProperties
        }
      />
    );
  }

  return (
    <div className={styles.spinningBox}>
      <Image src={game.image} alt={game.name} width={230} height={275} />
    </div>
  );
}

/** Builds the flowing dialogue-box sentence for a game, or "" if it has no info. */
function buildGameDialogue(game: BoardGame): string {
  const parts: string[] = [];
  if (game.description) parts.push(game.description);

  const specs: string[] = [];
  if (game.players) specs.push(`${game.players} jugadores`);
  if (game.age) specs.push(`desde los ${game.age.replace("+", "")} años`);
  if (game.duration) specs.push(`dura ${game.duration}`);
  if (specs.length > 0) parts.push(`${specs.join(", ")}.`);

  return parts.join(" ");
}

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
  }, [selectedGame]);

  const close = () => {
    setOpenShelfId(null);
    playMenuCloseSound();
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
      if (game) {
        addItem(game);
        playMenuConfirmSound();
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
            >
              {index === selectedIndex ? "▶ " : "  "}
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
