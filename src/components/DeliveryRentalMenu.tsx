"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { eventBus } from "@/game/eventBus";
import {
  playMenuMoveSound,
  playMenuConfirmSound,
  playMenuOpenSound,
  playMenuCloseSound,
} from "@/game/music";
import { rentalGames, type RentalGame } from "@/data/rentals";
import { isVisible } from "@/data/gameOverrides";
import { useGameOverrides } from "@/data/useGameOverrides";
import { buildGameDialogue } from "@/game/gameDialogue";
import SpinningBox from "./SpinningBox";
import styles from "./GameOverlay.module.css";

const STORE_WHATSAPP_NUMBER = "59899861116";

// Mismo catalogo que el Alquiler en el Local por ahora -- separar cuales
// titulos aplican a cada modalidad queda para un siguiente paso (ver
// IDEAS-FUTURAS.md).
function buildDeliveryWhatsAppUrl(name: string, price: number | null): string {
  const priceText = price !== null ? ` ($${price})` : "";
  const message = [
    "Hola! Quiero alquilar este juego a domicilio:",
    `- ${name}${priceText}`,
    "Te paso mi direccion para coordinar la entrega:",
  ].join("\n");
  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function DeliveryRentalMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedIndexRef = useRef(0);
  const selectedItemRef = useRef<HTMLLIElement | null>(null);
  const overrides = useGameOverrides();

  const visibleRentalGames = useMemo(
    () => (overrides ? rentalGames.filter((g) => isVisible(g.id, overrides)) : []),
    [overrides]
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
    eventBus.on("rental-delivery-open", handleOpen);
    return () => {
      eventBus.off("rental-delivery-open", handleOpen);
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

  const requestDelivery = (game: RentalGame) => {
    playMenuConfirmSound();
    window.open(
      buildDeliveryWhatsAppUrl(game.name, game.price),
      "_blank",
      "noopener,noreferrer"
    );
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
        if (game) requestDelivery(game);
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
          <span>Alquiler a Domicilio</span>
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
              onDoubleClick={() => requestDelivery(game)}
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
          <button className={styles.requestButton} onClick={() => requestDelivery(selectedGame)}>
            PEDIR (E)
          </button>
          <div className={styles.shopMenuHint}>ESC: Salir</div>
        </div>
      </div>
    </>
  );
}
