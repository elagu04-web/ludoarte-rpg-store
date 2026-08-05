"use client";

import { useEffect, useRef, useState } from "react";
import { allGames } from "@/data/allGames";
import { updateGameOverride } from "@/data/gameOverrides";
import { useGameOverrides } from "@/data/useGameOverrides";
import { playMenuMoveSound, playMenuConfirmSound } from "@/game/music";
import styles from "./InventoryScreen.module.css";

interface Row {
  stock: number;
  visible: boolean;
}

// Typing D ten times shouldn't fire ten separate saves -- wait for a
// short pause after the last tap before actually writing to Supabase.
const STOCK_SAVE_DEBOUNCE_MS = 500;

export default function InventoryScreen({ onExit }: { onExit: () => void }) {
  const overrides = useGameOverrides();
  const [rows, setRows] = useState<Record<string, Row> | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());

  const rowsRef = useRef<Record<string, Row>>({});
  const selectedIndexRef = useRef(0);
  const selectedItemRef = useRef<HTMLTableRowElement | null>(null);
  const stockSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Seed local rows once, the moment overrides finishes its first load --
  // from then on this screen's own state is the source of truth (every
  // edit updates it immediately, Supabase catches up in the background).
  useEffect(() => {
    if (!overrides || rows) return;
    const seeded: Record<string, Row> = {};
    for (const game of allGames) {
      const override = overrides.get(game.id);
      seeded[game.id] = {
        stock: override?.stock ?? game.baseStock,
        visible: override?.visible ?? true,
      };
    }
    setRows(seeded);
  }, [overrides, rows]);

  useEffect(() => {
    if (rows) rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

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
      const { error } = await updateGameOverride(id, { stock });
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

  const toggleVisible = async (id: string) => {
    const current = rowsRef.current[id];
    if (!current) return;
    const nextVisible = !current.visible;
    const updated = { ...rowsRef.current, [id]: { ...current, visible: nextVisible } };
    rowsRef.current = updated;
    setRows(updated);
    playMenuConfirmSound();
    const { error } = await updateGameOverride(id, { visible: nextVisible });
    markError(id, !!error);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onExit();
        return;
      }

      const game = allGames[selectedIndexRef.current];

      if (event.key === "w" || event.key === "W" || event.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev - 1 + allGames.length) % allGames.length);
        playMenuMoveSound();
      } else if (event.key === "s" || event.key === "S" || event.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % allGames.length);
        playMenuMoveSound();
      } else if (event.key === "a" || event.key === "A" || event.key === "ArrowLeft") {
        if (game?.forSale) adjustStock(game.id, -1);
      } else if (event.key === "d" || event.key === "D" || event.key === "ArrowRight") {
        if (game?.forSale) adjustStock(game.id, 1);
      } else if (event.key === "e" || event.key === "E" || event.key === "Enter") {
        if (game) toggleVisible(game.id);
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

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <span className={styles.title}>PANEL ADMIN &middot; INVENTARIO</span>
        <button className={styles.exitButton} onClick={onExit}>
          SALIR (ESC)
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th></th>
              <th>Juego</th>
              <th>Donde aparece</th>
              <th>Stock</th>
              <th>Visible</th>
            </tr>
          </thead>
          <tbody>
            {allGames.map((game, index) => {
              const row = rows[game.id];
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
                    {game.forSale && <span className={styles.tag}>Venta</span>}
                    {game.forRental && <span className={styles.tag}>Alquiler</span>}
                  </td>
                  <td>
                    {game.forSale ? (
                      <div className={styles.stockRow}>
                        <button
                          className={styles.stockButton}
                          onClick={() => adjustStock(game.id, -1)}
                        >
                          &#9664;
                        </button>
                        <span className={styles.stockValue}>{row.stock}</span>
                        <button
                          className={styles.stockButton}
                          onClick={() => adjustStock(game.id, 1)}
                        >
                          &#9654;
                        </button>
                      </div>
                    ) : (
                      <span className={styles.dash}>&mdash;</span>
                    )}
                  </td>
                  <td>
                    <button
                      className={row.visible ? styles.toggleOn : styles.toggleOff}
                      onClick={() => toggleVisible(game.id)}
                    >
                      {row.visible ? "VISIBLE" : "OCULTO"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className={styles.hint}>
        W/S: ELEGIR &middot; A/D: STOCK &middot; E: VISIBLE/OCULTO &middot; ESC: SALIR
      </p>
    </div>
  );
}
