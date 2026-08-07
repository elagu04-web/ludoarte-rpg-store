"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { eventBus } from "@/game/eventBus";
import {
  playMenuMoveSound,
  playMenuConfirmSound,
  playMenuOpenSound,
  playMenuCloseSound,
} from "@/game/music";
import { secondHandGames } from "@/data/sellableGames";
import { useGameOverrides } from "@/data/useGameOverrides";
import { useCustomGames } from "@/data/useCustomGames";
import { useCart } from "@/context/CartContext";
import { buildGameDialogue } from "@/game/gameDialogue";
import SpinningBox from "./SpinningBox";
import styles from "./GameOverlay.module.css";

export default function SecondHandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedIndexRef = useRef(0);
  const selectedItemRef = useRef<HTMLLIElement | null>(null);
  const overrides = useGameOverrides();
  const customGames = useCustomGames();
  const { addItem } = useCart();

  const games = useMemo(
    () => (overrides && customGames ? secondHandGames(overrides, customGames) : []),
    [overrides, customGames]
  );
  const gamesRef = useRef(games);
  useEffect(() => {
    gamesRef.current = games;
  }, [games]);

  const selectedGame = games[selectedIndex];

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setSelectedIndex(0);
      playMenuOpenSound();
    };
    eventBus.on("second-hand-open", handleOpen);
    return () => {
      eventBus.off("second-hand-open", handleOpen);
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

  const confirmSelection = () => {
    const game = gamesRef.current[selectedIndexRef.current];
    if (game) {
      addItem(game);
      playMenuConfirmSound();
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const moveSelection = (delta: number) => {
      setSelectedIndex((prev) => {
        const count = gamesRef.current.length;
        if (count === 0) return 0;
        return (prev + delta + count) % count;
      });
      playMenuMoveSound();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
        moveSelection(-1);
      } else if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
        moveSelection(1);
      } else if (event.key === "e" || event.key === "E" || event.key === "Enter") {
        confirmSelection();
      } else if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  if (games.length === 0) {
    return (
      <div className={`${styles.shopMenu} ${styles.rentalMenuPanel}`}>
        <div className={styles.shopMenuTitle}>
          <span>Juegos de Segunda Mano</span>
          <button className={styles.shopMenuClose} onClick={close}>
            ESC
          </button>
        </div>
        <p className={styles.shopMenuHint}>
          Todavia no hay ningun juego de segunda mano cargado.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.spinningBoxWrapper}>
        <SpinningBox game={selectedGame} key={selectedGame.id} />
      </div>

      <div className={`${styles.shopMenu} ${styles.rentalMenuPanel}`}>
        <div className={styles.shopMenuTitle}>
          <span>Juegos de Segunda Mano</span>
          <button className={styles.shopMenuClose} onClick={close}>
            ESC
          </button>
        </div>
        <ul className={`${styles.shopMenuList} ${styles.rentalMenuList}`}>
          {games.map((game, index) => (
            <li
              key={game.id}
              ref={index === selectedIndex ? selectedItemRef : undefined}
              className={
                index === selectedIndex ? styles.shopMenuItemSelected : styles.shopMenuItem
              }
              onClick={() => {
                if (index !== selectedIndexRef.current) playMenuMoveSound();
                setSelectedIndex(index);
              }}
              onDoubleClick={() => {
                addItem(game);
                playMenuConfirmSound();
              }}
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
