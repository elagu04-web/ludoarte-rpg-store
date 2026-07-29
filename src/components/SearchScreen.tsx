"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { eventBus } from "@/game/eventBus";
import {
  playMenuOpenSound,
  playMenuCloseSound,
  playMenuConfirmSound,
} from "@/game/music";
import { shelves } from "@/data/shelves";
import { useCart } from "@/context/CartContext";
import styles from "./SearchScreen.module.css";

const allGames = shelves.flatMap((shelf) => shelf.games);

export default function SearchScreen() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { addItem } = useCart();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    eventBus.on("search-open", handleOpen);
    return () => {
      eventBus.off("search-open", handleOpen);
    };
  }, []);

  useEffect(() => {
    eventBus.emit("menu-open", isOpen);
  }, [isOpen]);

  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      playMenuOpenSound();
      setQuery("");
    } else if (!isOpen && wasOpenRef.current) {
      playMenuCloseSound();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return allGames;
    return allGames.filter((game) =>
      game.name.toLowerCase().includes(normalized)
    );
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={close}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Buscador de juegos</h2>
          <button className={styles.closeButton} onClick={close}>
            ESC
          </button>
        </div>

        <input
          type="text"
          autoFocus
          placeholder="Buscar por nombre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchInput}
        />

        <p className={styles.resultCount}>
          {results.length} juego{results.length === 1 ? "" : "s"} encontrado
          {results.length === 1 ? "" : "s"}
        </p>

        {results.length === 0 ? (
          <p className={styles.emptyMessage}>
            No encontramos ningun juego con ese nombre.
          </p>
        ) : (
          <ul className={styles.resultList}>
            {results.map((game) => (
              <li key={game.id} className={styles.resultItem}>
                <div className={styles.resultInfo}>
                  <div className={styles.resultName}>{game.name}</div>
                  <div className={styles.resultPrice}>${game.price}</div>
                </div>
                <span
                  className={`${styles.stockBadge} ${
                    game.stock > 0 ? styles.stockAvailable : styles.stockOrder
                  }`}
                >
                  {game.stock > 0
                    ? "Disponible ahora"
                    : "Se puede conseguir por pedido"}
                </span>
                {game.stock > 0 && (
                  <button
                    className={styles.addButton}
                    onClick={() => {
                      addItem(game);
                      playMenuConfirmSound();
                    }}
                  >
                    Agregar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
