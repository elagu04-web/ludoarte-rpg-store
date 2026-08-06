"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { eventBus } from "@/game/eventBus";
import {
  playMenuMoveSound,
  playMenuConfirmSound,
  playMenuOpenSound,
  playMenuCloseSound,
} from "@/game/music";
import { shelves } from "@/data/shelves";
import { effectiveStock, isVisible } from "@/data/gameOverrides";
import { useGameOverrides } from "@/data/useGameOverrides";
import { useCustomGames } from "@/data/useCustomGames";
import { extraSellableGames } from "@/data/sellableGames";
import type { BoardGame } from "@/data/shelves";
import { useCart } from "@/context/CartContext";
import SpinningBox from "./SpinningBox";
import styles from "./GameOverlay.module.css";

const allGames = shelves.flatMap((shelf) => shelf.games);

export default function SearchScreen() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { addItem } = useCart();
  const overrides = useGameOverrides();
  const customGames = useCustomGames();

  const inputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLLIElement | null>(null);
  const selectedIndexRef = useRef(0);
  const queryRef = useRef(query);

  const searchableGames = useMemo(() => {
    if (!overrides) return [];
    const shelfGames = allGames
      .filter((game) => isVisible(game.id, overrides))
      .map((game) => ({
        ...game,
        stock: effectiveStock(game.id, game.stock, overrides),
      }));
    const custom: BoardGame[] = (customGames ?? [])
      .filter((game) => game.forSale && game.visible)
      .map((game) => ({
        id: game.id,
        name: game.name,
        price: game.price,
        image: game.image,
        stock: game.stock,
      }));
    return [...shelfGames, ...extraSellableGames(overrides), ...custom];
  }, [overrides, customGames]);

  const results = useMemo(() => {
    const normalized = appliedQuery.trim().toLowerCase();
    if (!normalized) return searchableGames;
    return searchableGames.filter((game) =>
      game.name.toLowerCase().includes(normalized)
    );
  }, [appliedQuery, searchableGames]);

  const resultsRef = useRef(results);
  const selectedGame = results[selectedIndex];

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    resultsRef.current = results;
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

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
      setAppliedQuery("");
      setSelectedIndex(0);
    } else if (!isOpen && wasOpenRef.current) {
      playMenuCloseSound();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const close = () => setIsOpen(false);

  const runSearch = () => {
    setAppliedQuery(queryRef.current);
    setSelectedIndex(0);
    playMenuConfirmSound();
  };

  useEffect(() => {
    if (!isOpen) return;

    const moveSelection = (delta: number) => {
      setSelectedIndex((prev) => {
        const count = resultsRef.current.length;
        if (count === 0) return 0;
        return (prev + delta + count) % count;
      });
      playMenuMoveSound();
    };

    const confirmSelection = () => {
      const game = resultsRef.current[selectedIndexRef.current];
      if (game && game.stock > 0) {
        addItem(game);
        playMenuConfirmSound();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const typingInSearch = document.activeElement === inputRef.current;

      if (event.key === "Escape") {
        close();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        if (typingInSearch) {
          runSearch();
          inputRef.current?.blur();
        } else {
          // Enter is how you get INTO the search box from the list (the
          // other way in is a mouse click) -- it doesn't double as "add",
          // that's what E is for, same as every other menu in the game.
          inputRef.current?.focus();
        }
        return;
      }

      if (event.key === "ArrowUp") {
        moveSelection(-1);
        return;
      }
      if (event.key === "ArrowDown") {
        moveSelection(1);
        return;
      }

      // Letter shortcuts only apply once you're out of the search box --
      // otherwise typing a name like "Saboteur" would move the selection
      // and add games to the cart instead of spelling out the word.
      if (typingInSearch) return;

      if (event.key === "w" || event.key === "W") {
        moveSelection(-1);
      } else if (event.key === "s" || event.key === "S") {
        moveSelection(1);
      } else if (event.key === "e" || event.key === "E") {
        confirmSelection();
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
  }, [isOpen, addItem]);

  if (!isOpen) return null;

  return (
    <>
      {selectedGame && (
        <div className={styles.spinningBoxWrapper}>
          <SpinningBox game={selectedGame} key={selectedGame.id} />
        </div>
      )}

      <div className={`${styles.shopMenu} ${styles.searchMenuPanel}`}>
        <div className={styles.shopMenuTitle}>
          <span>Buscador de juegos</span>
          <button className={styles.shopMenuClose} onClick={close}>
            ESC
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder="Enter o clic para escribir..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchMenuInput}
        />

        {results.length === 0 ? (
          <p className={styles.searchMenuEmpty}>
            No encontramos ningun juego con ese nombre.
          </p>
        ) : (
          <ul className={`${styles.shopMenuList} ${styles.searchMenuList}`}>
            {results.map((game, index) => (
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
                  inputRef.current?.blur();
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
        )}

        {selectedGame && (
          <>
            <div
              className={`${styles.searchMenuStatus} ${
                selectedGame.stock > 0
                  ? styles.searchMenuStatusAvailable
                  : styles.searchMenuStatusOrder
              }`}
            >
              {selectedGame.stock > 0
                ? "Disponible ahora"
                : "Pedilo ya en el camión del estacionamiento"}
            </div>
            <div className={styles.shopMenuFooter}>
              <div className={styles.shopMenuPrice}>${selectedGame.price}</div>
              <div className={styles.shopMenuHint}>
                {selectedGame.stock > 0 ? "E: Agregar" : ""} &middot; ESC: Salir
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
