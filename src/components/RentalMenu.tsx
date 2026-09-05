"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { eventBus } from "@/game/eventBus";
import {
  playMenuMoveSound,
  playMenuConfirmSound,
  playMenuOpenSound,
  playMenuCloseSound,
} from "@/game/music";
import type { RentalGame } from "@/data/rentals";
import { allRentalGames } from "@/data/sellableGames";
import { useGameOverrides } from "@/data/useGameOverrides";
import { useCustomGames } from "@/data/useCustomGames";
import { buildGameDialogue } from "@/game/gameDialogue";
import SpinningBox from "./SpinningBox";
import styles from "./GameOverlay.module.css";

const STORE_WHATSAPP_NUMBER = "59899861116";

function buildRentalWhatsAppUrl(name: string, price: number | null): string {
  const priceText = price !== null ? ` ($${price})` : "";
  const message = [
    "Hola! Quiero alquilar este juego (retiro en el local):",
    `- ${name}${priceText}`,
    "Me confirman disponibilidad?",
  ].join("\n");
  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function RentalMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedIndexRef = useRef(0);
  const selectedItemRef = useRef<HTMLLIElement | null>(null);
  const overrides = useGameOverrides();
  const customGames = useCustomGames();

  const visibleRentalGames = useMemo(
    () => (overrides ? allRentalGames(overrides, customGames ?? []) : []),
    [overrides, customGames]
  );
  const visibleRentalGamesRef = useRef(visibleRentalGames);
  useEffect(() => {
    visibleRentalGamesRef.current = visibleRentalGames;
  }, [visibleRentalGames]);

  const selectedGame = visibleRentalGames[selectedIndex];

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

  const requestRental = (game: RentalGame) => {
    playMenuConfirmSound();
    window.open(buildRentalWhatsAppUrl(game.name, game.price), "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (!isOpen) return;

    const moveSelection = (delta: number) => {
      setSelectedIndex((prev) => {
        const count = visibleRentalGamesRef.current.length;
        if (count === 0) return 0;
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
      } else if (event.key === "e" || event.key === "E" || event.key === "Enter") {
        const game = visibleRentalGamesRef.current[selectedIndexRef.current];
        if (game) requestRental(game);
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
          <span>Alquiler en el Local</span>
          <button className={styles.shopMenuClose} onClick={close}>
            ESC
          </button>
        </div>
        <ul className={`${styles.shopMenuList} ${styles.rentalMenuList}`}>
          {visibleRentalGames.map((game, index) => (
            <li
              key={game.id}
              ref={index === selectedIndex ? selectedItemRef : undefined}
              className={
                index === selectedIndex
                  ? styles.shopMenuItemSelected
                  : styles.shopMenuItem
              }
              onClick={() => {
                if (index !== selectedIndexRef.current) playMenuMoveSound();
                setSelectedIndex(index);
              }}
              onDoubleClick={() => requestRental(game)}
            >
              {index === selectedIndex ? "▶ " : "  "}
              {game.name}
            </li>
          ))}
        </ul>
        <div className={styles.shopMenuFooter}>
          <div className={styles.shopMenuPrice}>
            {/* price>0, no solo !==null: un juego a mano marcado para
                alquiler pero sin precio cargado todavia guarda 0. */}
            {selectedGame.price
              ? `$${selectedGame.price}`
              : "Consultar precio"}
          </div>
          <button className={styles.requestButton} onClick={() => requestRental(selectedGame)}>
            PEDIR (E)
          </button>
          <div className={styles.shopMenuHint}>ESC: Salir</div>
        </div>
      </div>
    </>
  );
}
