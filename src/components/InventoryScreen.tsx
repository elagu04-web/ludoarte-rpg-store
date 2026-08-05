"use client";

import { useEffect, useState } from "react";
import { allGames } from "@/data/allGames";
import { updateGameOverride } from "@/data/gameOverrides";
import { useGameOverrides } from "@/data/useGameOverrides";
import styles from "./InventoryScreen.module.css";

export default function InventoryScreen({ onExit }: { onExit: () => void }) {
  const overrides = useGameOverrides();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  // Local text while typing a stock number, keyed by game id, so the
  // input doesn't fight the user on every keystroke before it saves.
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExit();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit]);

  if (!overrides) {
    return (
      <div className={styles.screen}>
        <p className={styles.hint}>Cargando...</p>
      </div>
    );
  }

  const saveStock = async (id: string, value: string) => {
    const parsed = value.trim() === "" ? 0 : Number(value);
    if (Number.isNaN(parsed) || parsed < 0) return;
    setSavingId(id);
    setErrorId(null);
    const { error } = await updateGameOverride(id, { stock: parsed });
    setSavingId(null);
    if (error) setErrorId(id);
    setStockDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const toggleVisible = async (id: string, current: boolean) => {
    setSavingId(id);
    setErrorId(null);
    const { error } = await updateGameOverride(id, { visible: !current });
    setSavingId(null);
    if (error) setErrorId(id);
  };

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
              <th>Visible en la tienda</th>
            </tr>
          </thead>
          <tbody>
            {allGames.map((game) => {
              const override = overrides.get(game.id);
              const visible = override?.visible ?? true;
              const stock = override?.stock ?? game.baseStock;
              const draft = stockDrafts[game.id];

              return (
                <tr key={game.id} className={visible ? undefined : styles.rowHidden}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={game.image} alt="" className={styles.thumb} />
                  </td>
                  <td className={styles.nameCell}>
                    {game.name}
                    {errorId === game.id && (
                      <span className={styles.error}>Error al guardar</span>
                    )}
                  </td>
                  <td className={styles.tagsCell}>
                    {game.forSale && <span className={styles.tag}>Venta</span>}
                    {game.forRental && <span className={styles.tag}>Alquiler</span>}
                  </td>
                  <td>
                    {game.forSale ? (
                      <input
                        type="number"
                        min={0}
                        className={styles.stockInput}
                        value={draft ?? stock}
                        onChange={(e) =>
                          setStockDrafts((prev) => ({
                            ...prev,
                            [game.id]: e.target.value,
                          }))
                        }
                        onBlur={(e) => saveStock(game.id, e.target.value)}
                        disabled={savingId === game.id}
                      />
                    ) : (
                      <span className={styles.dash}>&mdash;</span>
                    )}
                  </td>
                  <td>
                    <button
                      className={visible ? styles.toggleOn : styles.toggleOff}
                      onClick={() => toggleVisible(game.id, visible)}
                      disabled={savingId === game.id}
                    >
                      {visible ? "VISIBLE" : "OCULTO"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
