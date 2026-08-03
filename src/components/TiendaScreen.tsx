"use client";

import { useEffect, useRef, useState } from "react";
import { shelves, type BoardGame } from "@/data/shelves";
import { useCart } from "@/context/CartContext";
import {
  playMenuMoveSound,
  playMenuConfirmSound,
  playMenuOpenSound,
  playMenuCloseSound,
} from "@/game/music";
import styles from "./TiendaScreen.module.css";

const STORE_WHATSAPP_NUMBER = "59899861116";

interface FlatEntry {
  game: BoardGame;
  shelfTitle: string;
  isFirstInShelf: boolean;
}

const FLAT_GAMES: FlatEntry[] = shelves.flatMap((shelf) =>
  shelf.games.map((game, i) => ({
    game,
    shelfTitle: shelf.title,
    isFirstInShelf: i === 0,
  }))
);

function buildSingleItemWhatsAppUrl(game: BoardGame): string {
  const message = [
    "Hola! Quiero pedir o consultar este juego:",
    `- ${game.name} ($${game.price})`,
    "Me avisan si lo tienen o cuando esta disponible?",
  ].join("\n");
  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function TiendaScreen({ onExit }: { onExit: () => void }) {
  const { addItem, totalItems, openCart } = useCart();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedIndexRef = useRef(0);
  const selectedItemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  useEffect(() => {
    playMenuOpenSound();
  }, []);

  const selected = FLAT_GAMES[selectedIndex]?.game;

  const buyNow = (game: BoardGame) => {
    addItem(game);
    playMenuConfirmSound();
  };

  const requestByWhatsApp = (game: BoardGame) => {
    playMenuConfirmSound();
    window.open(buildSingleItemWhatsAppUrl(game), "_blank", "noopener,noreferrer");
  };

  const confirmSelection = () => {
    const game = FLAT_GAMES[selectedIndexRef.current]?.game;
    if (!game) return;
    if (game.stock > 0) buyNow(game);
    else requestByWhatsApp(game);
  };

  const exit = () => {
    playMenuCloseSound();
    onExit();
  };

  useEffect(() => {
    const moveSelection = (delta: number) => {
      setSelectedIndex((prev) => {
        const count = FLAT_GAMES.length;
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
        exit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!selected) return null;

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <span className={styles.title}>LUDOARTE · TIENDA</span>
        <div className={styles.headerButtons}>
          <button className={styles.cartButton} onClick={() => openCart()}>
            CARRITO ({totalItems})
          </button>
          <button className={styles.exitButton} onClick={exit}>
            SALIR
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.preview}>
          <div className={styles.previewImageWrapper}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.image} alt={selected.name} className={styles.previewImage} />
          </div>
          <p className={styles.previewName}>{selected.name}</p>
          {selected.description && (
            <p className={styles.previewDescription}>{selected.description}</p>
          )}
          <div className={styles.previewSpecs}>
            {selected.players && <span>JUGADORES: {selected.players}</span>}
            {selected.age && <span>EDAD: {selected.age}</span>}
            {selected.duration && <span>TIEMPO: {selected.duration}</span>}
          </div>

          <div className={styles.previewFooter}>
            <span className={styles.previewPrice}>${selected.price}</span>
            {selected.stock > 0 ? (
              <button className={styles.buyButton} onClick={() => buyNow(selected)}>
                COMPRAR (E)
              </button>
            ) : (
              <button
                className={styles.requestButton}
                onClick={() => requestByWhatsApp(selected)}
              >
                PEDIR POR WHATSAPP (E)
              </button>
            )}
          </div>
          {selected.stock === 0 && (
            <p className={styles.requestHint}>Se lo traemos -- consultanos por WhatsApp</p>
          )}
        </div>

        <ul className={styles.list}>
          {FLAT_GAMES.map(({ game, shelfTitle, isFirstInShelf }, index) => (
            <li key={game.id}>
              {isFirstInShelf && (
                <div className={styles.listHeader}>{shelfTitle.toUpperCase()}</div>
              )}
              <div
                ref={index === selectedIndex ? selectedItemRef : undefined}
                className={
                  index === selectedIndex ? styles.rowSelected : styles.row
                }
                onClick={() => {
                  if (index !== selectedIndexRef.current) playMenuMoveSound();
                  setSelectedIndex(index);
                }}
                onDoubleClick={() => {
                  if (game.stock > 0) buyNow(game);
                  else requestByWhatsApp(game);
                }}
              >
                <span className={styles.rowName}>
                  {index === selectedIndex ? "▶ " : "  "}
                  {game.name}
                </span>
                <span className={styles.rowPrice}>
                  {game.stock > 0 ? `$${game.price}` : "PEDIDO"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
