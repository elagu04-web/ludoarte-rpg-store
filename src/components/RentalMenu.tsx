"use client";

import { useEffect, useRef, useState } from "react";
import { eventBus } from "@/game/eventBus";
import {
  playMenuMoveSound,
  playMenuOpenSound,
  playMenuCloseSound,
} from "@/game/music";
import { rentalGames } from "@/data/rentals";
import { buildGameDialogue } from "@/game/gameDialogue";
import SpinningBox from "./SpinningBox";
import styles from "./GameOverlay.module.css";

export default function RentalMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedIndexRef = useRef(0);
  const selectedItemRef = useRef<HTMLLIElement | null>(null);

  const selectedGame = rentalGames[selectedIndex];

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setSelectedIndex(0);
      playMenuOpenSound();
    };
    eventBus.on("rental-open", handleOpen);
    return () => {
      eventBus.off("rental-open", handleOpen);
    };
  }, []);

  useEffect(() => {
    eventBus.emit("menu-open", isOpen);
  }, [isOpen]);

  useEffect(() => {
    eventBus.emit(
      "game-dialogue",
      isOpen && selectedGame ? buildGameDialogue(selectedGame) : ""
    );
  }, [isOpen, selectedGame]);

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const close = () => {
    setIsOpen(false);
    playMenuCloseSound();
  };

  useEffect(() => {
    if (!isOpen) return;

    const moveSelection = (delta: number) => {
      setSelectedIndex((prev) => {
        const count = rentalGames.length;
        return (prev + delta + count) % count;
      });
      playMenuMoveSound();
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

    window.addEventListener("keydown", handleKeyDown);
    eventBus.on("touch-direction", handleTouchDirection);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      eventBus.off("touch-direction", handleTouchDirection);
    };
  }, [isOpen]);

  if (!isOpen || !selectedGame) return null;

  return (
    <>
      <div className={styles.spinningBoxWrapper}>
        <SpinningBox game={selectedGame} key={selectedGame.id} />
      </div>

      <div className={`${styles.shopMenu} ${styles.rentalMenuPanel}`}>
        <div className={styles.shopMenuTitle}>
          <span>Alquiler de juegos</span>
          <button className={styles.shopMenuClose} onClick={close}>
            ESC
          </button>
        </div>
        <ul className={`${styles.shopMenuList} ${styles.rentalMenuList}`}>
          {rentalGames.map((game, index) => (
            <li
              key={game.id}
              ref={index === selectedIndex ? selectedItemRef : undefined}
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
          <div className={styles.shopMenuPrice}>
            {selectedGame.price !== null
              ? `$${selectedGame.price}`
              : "Consultar precio"}
          </div>
          <div className={styles.shopMenuHint}>ESC: Salir</div>
        </div>
      </div>
    </>
  );
}
