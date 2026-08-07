"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { allGames } from "@/data/allGames";
import { PLACEHOLDER_IMAGE } from "@/data/shelves";
import { updateGameOverride } from "@/data/gameOverrides";
import { useGameOverrides } from "@/data/useGameOverrides";
import {
  addCustomGame,
  deleteCustomGame,
  updateCustomGame,
  expectedImagePath,
} from "@/data/customGames";
import { useCustomGames } from "@/data/useCustomGames";
import { playMenuMoveSound, playMenuConfirmSound } from "@/game/music";
import styles from "./InventoryScreen.module.css";

interface Row {
  stock: number;
  price: number;
  visible: boolean;
  forSale: boolean;
  forRental: boolean;
}

interface DisplayGame {
  id: string;
  name: string;
  image: string;
  forSale: boolean;
  forRental: boolean;
  isCustom: boolean;
}

// Typing D ten times shouldn't fire ten separate saves -- wait for a
// short pause after the last tap before actually writing to Supabase.
const STOCK_SAVE_DEBOUNCE_MS = 500;
const PRICE_STEP = 10;
const PRICE_STEP_FAST = 100;

export default function InventoryScreen({ onExit }: { onExit: () => void }) {
  const overrides = useGameOverrides();
  const customGames = useCustomGames();
  const [rows, setRows] = useState<Record<string, Row> | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [newGameForSale, setNewGameForSale] = useState(true);
  const [newGameForRental, setNewGameForRental] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const rowsRef = useRef<Record<string, Row>>({});
  const selectedIndexRef = useRef(0);
  const selectedItemRef = useRef<HTMLTableRowElement | null>(null);
  const stockSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const priceSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const isAddingRef = useRef(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Every game the panel lists: the 81 from the code (allGames) plus
  // whatever the admin created from here (customGames), all mixed
  // together in alphabetical order (same convention as allGames.ts)
  // instead of dumping new ones at the end.
  const displayGames: DisplayGame[] = useMemo(() => {
    const fromCode: DisplayGame[] = allGames.map((g) => ({
      id: g.id,
      name: g.name,
      image: g.image,
      forSale: g.forSale,
      forRental: g.forRental,
      isCustom: false,
    }));
    const custom: DisplayGame[] = (customGames ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      image: g.image,
      forSale: g.forSale,
      forRental: g.forRental,
      isCustom: true,
    }));
    return [...fromCode, ...custom].sort((a, b) =>
      a.name.localeCompare(b.name, "es")
    );
  }, [customGames]);
  const displayGamesRef = useRef(displayGames);
  useEffect(() => {
    displayGamesRef.current = displayGames;
  }, [displayGames]);

  const customIds = useMemo(
    () => new Set((customGames ?? []).map((g) => g.id)),
    [customGames]
  );
  // adjustStock/adjustPrice/toggleVisible are read by the keydown effect
  // below, which registers its listener once ([onExit]) and never picks
  // up later renders -- without this ref they'd keep calling saveStock/
  // savePrice from that first render, forever seeing an empty customIds
  // and misrouting a newly-added custom game's edits to the wrong table.
  const customIdsRef = useRef(customIds);
  useEffect(() => {
    customIdsRef.current = customIds;
  }, [customIds]);

  // Seed rows for any game that doesn't have one yet -- runs on first
  // load AND every time a game gets added, so a freshly-created custom
  // game gets a row without needing a full re-seed of everything else
  // (which would blow away edits already made this session).
  useEffect(() => {
    if (!overrides || !customGames) return;
    setRows((prev) => {
      const next = { ...(prev ?? {}) };
      let changed = !prev;
      for (const game of allGames) {
        if (next[game.id]) continue;
        const override = overrides.get(game.id);
        next[game.id] = {
          stock: override?.stock ?? game.baseStock,
          price: override?.price ?? game.basePrice ?? 0,
          visible: override?.visible ?? true,
          forSale: override?.forSale ?? game.forSale,
          forRental: override?.forRental ?? game.forRental,
        };
        changed = true;
      }
      for (const game of customGames) {
        if (next[game.id]) continue;
        next[game.id] = {
          stock: game.stock,
          price: game.price,
          visible: game.visible,
          forSale: game.forSale,
          forRental: game.forRental,
        };
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [overrides, customGames]);

  useEffect(() => {
    if (rows) rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    setSelectedIndex((prev) => Math.min(prev, Math.max(0, displayGames.length - 1)));
  }, [displayGames.length]);

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  useEffect(() => {
    isAddingRef.current = isAdding;
    if (isAdding) addInputRef.current?.focus();
  }, [isAdding]);

  const markError = (id: string, hasError: boolean) => {
    setErrorIds((prev) => {
      const next = new Set(prev);
      if (hasError) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const saveStock = (id: string, stock: number) => {
    if (stockSaveTimers.current[id]) clearTimeout(stockSaveTimers.current[id]);
    stockSaveTimers.current[id] = setTimeout(async () => {
      const { error } = customIdsRef.current.has(id)
        ? await updateCustomGame(id, { stock })
        : await updateGameOverride(id, { stock });
      markError(id, !!error);
    }, STOCK_SAVE_DEBOUNCE_MS);
  };

  const adjustStock = (id: string, delta: number) => {
    const current = rowsRef.current[id];
    if (!current) return;
    const next = Math.max(0, current.stock + delta);
    if (next === current.stock) return;
    const updated = { ...rowsRef.current, [id]: { ...current, stock: next } };
    rowsRef.current = updated;
    setRows(updated);
    markError(id, false);
    saveStock(id, next);
    playMenuMoveSound();
  };

  const savePrice = (id: string, price: number) => {
    if (priceSaveTimers.current[id]) clearTimeout(priceSaveTimers.current[id]);
    priceSaveTimers.current[id] = setTimeout(async () => {
      const { error } = customIdsRef.current.has(id)
        ? await updateCustomGame(id, { price })
        : await updateGameOverride(id, { price });
      markError(id, !!error);
    }, STOCK_SAVE_DEBOUNCE_MS);
  };

  const adjustPrice = (id: string, delta: number) => {
    const current = rowsRef.current[id];
    if (!current) return;
    const next = Math.max(0, current.price + delta);
    if (next === current.price) return;
    const updated = { ...rowsRef.current, [id]: { ...current, price: next } };
    rowsRef.current = updated;
    setRows(updated);
    markError(id, false);
    savePrice(id, next);
    playMenuMoveSound();
  };

  const toggleVisible = async (id: string) => {
    const current = rowsRef.current[id];
    if (!current) return;
    const nextVisible = !current.visible;
    const updated = { ...rowsRef.current, [id]: { ...current, visible: nextVisible } };
    rowsRef.current = updated;
    setRows(updated);
    playMenuConfirmSound();
    const { error } = customIdsRef.current.has(id)
      ? await updateCustomGame(id, { visible: nextVisible })
      : await updateGameOverride(id, { visible: nextVisible });
    markError(id, !!error);
  };

  // Venta/Alquiler: para un juego del catalogo esto solo cambia lo que
  // muestra este panel (todavia no hay nada leyendo forSale/forRental de
  // game_overrides para decidir que aparece en Tienda/Alquiler); para un
  // juego agregado a mano SI cambia si se muestra (ver sellableGames.ts).
  const toggleForSale = async (id: string) => {
    const current = rowsRef.current[id];
    if (!current) return;
    const nextForSale = !current.forSale;
    const updated = { ...rowsRef.current, [id]: { ...current, forSale: nextForSale } };
    rowsRef.current = updated;
    setRows(updated);
    playMenuConfirmSound();
    const { error } = customIdsRef.current.has(id)
      ? await updateCustomGame(id, { forSale: nextForSale })
      : await updateGameOverride(id, { forSale: nextForSale });
    markError(id, !!error);
  };

  const toggleForRental = async (id: string) => {
    const current = rowsRef.current[id];
    if (!current) return;
    const nextForRental = !current.forRental;
    const updated = { ...rowsRef.current, [id]: { ...current, forRental: nextForRental } };
    rowsRef.current = updated;
    setRows(updated);
    playMenuConfirmSound();
    const { error } = customIdsRef.current.has(id)
      ? await updateCustomGame(id, { forRental: nextForRental })
      : await updateGameOverride(id, { forRental: nextForRental });
    markError(id, !!error);
  };

  const submitAddGame = async () => {
    const name = newGameName.trim();
    if (!name) return;
    if (!newGameForSale && !newGameForRental) {
      setAddError("Elegi venta y/o alquiler");
      return;
    }
    const { error } = await addCustomGame(name, {
      forSale: newGameForSale,
      forRental: newGameForRental,
    });
    if (error) {
      setAddError(error);
      return;
    }
    setNewGameName("");
    setNewGameForSale(true);
    setNewGameForRental(false);
    setAddError(null);
    setIsAdding(false);
    playMenuConfirmSound();
  };

  const cancelAddGame = () => {
    setIsAdding(false);
    setNewGameName("");
    setNewGameForSale(true);
    setNewGameForRental(false);
    setAddError(null);
  };

  const removeCustomGame = async (id: string) => {
    const { error } = await deleteCustomGame(id);
    if (error) {
      markError(id, true);
      return;
    }
    setRows((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    playMenuConfirmSound();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // isAddingRef lags one tick behind the state that triggers it (set
      // in an effect) -- also check actual DOM focus so a keystroke fired
      // right after clicking "+ Agregar juego" can't slip through as a
      // navigation shortcut before the ref catches up.
      if (isAddingRef.current || document.activeElement === addInputRef.current) {
        if (event.key === "Escape") cancelAddGame();
        // Any other key is typed into the name field -- don't treat
        // letters like "w"/"a"/"d" as navigation shortcuts while adding.
        return;
      }

      if (event.key === "Escape") {
        onExit();
        return;
      }

      const games = displayGamesRef.current;
      const game = games[selectedIndexRef.current];

      if (event.key === "w" || event.key === "W" || event.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev - 1 + games.length) % games.length);
        playMenuMoveSound();
      } else if (event.key === "s" || event.key === "S" || event.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % games.length);
        playMenuMoveSound();
      } else if (event.key === "a" || event.key === "A" || event.key === "ArrowLeft") {
        if (!game) return;
        if (event.shiftKey) adjustPrice(game.id, -PRICE_STEP_FAST);
        else adjustStock(game.id, -1);
      } else if (event.key === "d" || event.key === "D" || event.key === "ArrowRight") {
        if (!game) return;
        if (event.shiftKey) adjustPrice(game.id, PRICE_STEP_FAST);
        else adjustStock(game.id, 1);
      } else if (event.key === "e" || event.key === "E" || event.key === "Enter") {
        if (game) toggleVisible(game.id);
      } else if (event.key === "v" || event.key === "V") {
        if (game) toggleForSale(game.id);
      } else if (event.key === "l" || event.key === "L") {
        if (game) toggleForRental(game.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onExit]);

  if (!rows) {
    return (
      <div className={styles.screen}>
        <p className={styles.hint}>Cargando...</p>
      </div>
    );
  }

  const selectedGame = displayGames[selectedIndex];
  const selectedRow = selectedGame ? rows[selectedGame.id] : undefined;
  const needsRealPhoto =
    !!selectedGame && selectedGame.isCustom && selectedGame.image === PLACEHOLDER_IMAGE;

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <span className={styles.title}>PANEL ADMIN &middot; INVENTARIO</span>
        <div className={styles.headerButtons}>
          {!isAdding && (
            <button className={styles.addButton} onClick={() => setIsAdding(true)}>
              + AGREGAR JUEGO
            </button>
          )}
          <button className={styles.exitButton} onClick={onExit}>
            SALIR (ESC)
          </button>
        </div>
      </div>

      {isAdding && (
        <div className={styles.addForm}>
          <input
            ref={addInputRef}
            type="text"
            className={styles.addInput}
            placeholder="Nombre del juego nuevo..."
            value={newGameName}
            onChange={(e) => setNewGameName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitAddGame();
            }}
          />
          <button
            className={newGameForSale ? styles.toggleOn : styles.toggleOff}
            onClick={() => setNewGameForSale((prev) => !prev)}
          >
            VENTA: {newGameForSale ? "SI" : "NO"}
          </button>
          <button
            className={newGameForRental ? styles.toggleOn : styles.toggleOff}
            onClick={() => setNewGameForRental((prev) => !prev)}
          >
            ALQUILER: {newGameForRental ? "SI" : "NO"}
          </button>
          <button className={styles.addButton} onClick={submitAddGame}>
            CREAR (ENTER)
          </button>
          <button className={styles.exitButton} onClick={cancelAddGame}>
            CANCELAR (ESC)
          </button>
          {addError && <span className={styles.error}>{addError}</span>}
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Juego</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {displayGames.map((game, index) => {
                const row = rows[game.id];
                if (!row) return null;
                const isSelected = index === selectedIndex;

                return (
                  <tr
                    key={game.id}
                    ref={isSelected ? selectedItemRef : undefined}
                    className={[
                      isSelected ? styles.rowSelected : "",
                      row.visible ? "" : styles.rowHidden,
                    ].join(" ")}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <td>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={game.image} alt="" className={styles.thumb} />
                    </td>
                    <td className={styles.nameCell}>
                      <span className={styles.nameRow}>
                        {isSelected ? "▶ " : "  "}
                        {game.name}
                      </span>
                      {errorIds.has(game.id) && (
                        <span className={styles.error}>Error al guardar</span>
                      )}
                    </td>
                    <td className={styles.tagsCell}>
                      {(row.forSale || row.stock > 0) && (
                        <span className={styles.tag}>Venta</span>
                      )}
                      {row.forRental && <span className={styles.tag}>Alquiler</span>}
                      {!row.visible && <span className={styles.tag}>Oculto</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selectedGame && selectedRow && (
          <div className={styles.detailPanel}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedGame.image} alt="" className={styles.detailThumb} />
            <p className={styles.detailName}>{selectedGame.name}</p>
            {errorIds.has(selectedGame.id) && (
              <p className={styles.error}>Error al guardar</p>
            )}
            {needsRealPhoto && (
              <p className={styles.imageHint}>
                Falta foto: {expectedImagePath(selectedGame.id)}
              </p>
            )}

            <div className={styles.detailField}>
              <span className={styles.detailLabel}>Stock (A/D)</span>
              <div className={styles.stockRow}>
                <button
                  className={styles.stockButton}
                  onClick={() => adjustStock(selectedGame.id, -1)}
                >
                  &#9664;
                </button>
                <span className={styles.stockValue}>{selectedRow.stock}</span>
                <button
                  className={styles.stockButton}
                  onClick={() => adjustStock(selectedGame.id, 1)}
                >
                  &#9654;
                </button>
              </div>
            </div>

            <div className={styles.detailField}>
              <span className={styles.detailLabel}>Precio (SHIFT+A/D)</span>
              <div className={styles.stockRow}>
                <button
                  className={styles.stockButton}
                  onClick={() => adjustPrice(selectedGame.id, -PRICE_STEP)}
                >
                  &#9664;
                </button>
                <span className={styles.stockValue}>${selectedRow.price}</span>
                <button
                  className={styles.stockButton}
                  onClick={() => adjustPrice(selectedGame.id, PRICE_STEP)}
                >
                  &#9654;
                </button>
              </div>
            </div>

            <div className={styles.detailField}>
              <span className={styles.detailLabel}>Visible (E)</span>
              <button
                className={selectedRow.visible ? styles.toggleOn : styles.toggleOff}
                onClick={() => toggleVisible(selectedGame.id)}
              >
                {selectedRow.visible ? "VISIBLE" : "OCULTO"}
              </button>
            </div>

            <div className={styles.detailField}>
              <span className={styles.detailLabel}>Venta (V)</span>
              <button
                className={selectedRow.forSale ? styles.toggleOn : styles.toggleOff}
                onClick={() => toggleForSale(selectedGame.id)}
              >
                {selectedRow.forSale ? "SI" : "NO"}
              </button>
            </div>

            <div className={styles.detailField}>
              <span className={styles.detailLabel}>Alquiler (L)</span>
              <button
                className={selectedRow.forRental ? styles.toggleOn : styles.toggleOff}
                onClick={() => toggleForRental(selectedGame.id)}
              >
                {selectedRow.forRental ? "SI" : "NO"}
              </button>
            </div>

            {selectedGame.isCustom && (
              <button
                className={styles.deleteButton}
                onClick={() => removeCustomGame(selectedGame.id)}
              >
                Eliminar juego
              </button>
            )}
          </div>
        )}
      </div>

      <p className={styles.hint}>
        W/S: ELEGIR &middot; A/D: STOCK &middot; SHIFT+A/D: PRECIO &middot; E:
        VISIBLE &middot; V: VENTA &middot; L: ALQUILER &middot; ESC: SALIR
      </p>
    </div>
  );
}
