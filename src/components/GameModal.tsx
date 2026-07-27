"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { eventBus } from "@/game/eventBus";
import { shelves } from "@/data/shelves";
import { useCart } from "@/context/CartContext";
import styles from "./GameOverlay.module.css";

export default function GameModal() {
  const [openShelfId, setOpenShelfId] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    const handleOpen = (shelfId: string) => setOpenShelfId(shelfId);
    eventBus.on("shelf-open", handleOpen);
    return () => {
      eventBus.off("shelf-open", handleOpen);
    };
  }, []);

  if (!openShelfId) return null;

  const shelf = shelves.find((item) => item.id === openShelfId);
  if (!shelf) return null;

  return (
    <div
      className={styles.modalBackdrop}
      onClick={() => setOpenShelfId(null)}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{shelf.title}</h2>
          <button
            className={styles.closeButton}
            onClick={() => setOpenShelfId(null)}
          >
            X
          </button>
        </div>
        <div className={styles.gameList}>
          {shelf.games.map((game) => (
            <div key={game.id} className={styles.gameCard}>
              <Image
                src={game.image}
                alt={game.name}
                width={120}
                height={120}
                className={styles.gameImage}
              />
              <p className={styles.gameName}>{game.name}</p>
              <p className={styles.gamePrice}>${game.price}</p>
              <button
                className={styles.addButton}
                onClick={() => addItem(game)}
              >
                Agregar al carrito
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
