"use client";

import { useEffect, useRef, useState } from "react";
import { eventBus } from "@/game/eventBus";
import { playMenuOpenSound, playMenuCloseSound, playMenuConfirmSound } from "@/game/music";
import { shelves } from "@/data/shelves";
import styles from "./OrderTruckScreen.module.css";

const STORE_WHATSAPP_NUMBER = "59899861116";

const outOfStockGames = shelves
  .flatMap((shelf) => shelf.games)
  .filter((game) => game.stock === 0);

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
}

function buildWhatsAppOrderUrl(items: OrderItem[]): string {
  const lines = items.map((item) => `- ${item.name} x${item.quantity}`);
  const message = [
    "Hola! Quiero pedir o consultar estos juegos:",
    ...lines,
    "Me avisan si los tienen o cuando esten disponibles?",
  ].join("\n");

  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function OrderTruckScreen() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    eventBus.on("order-truck-open", handleOpen);
    return () => {
      eventBus.off("order-truck-open", handleOpen);
    };
  }, []);

  useEffect(() => {
    eventBus.emit("menu-open", isOpen);
  }, [isOpen]);

  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      playMenuOpenSound();
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

  const addFromQuery = () => {
    const name = query.trim();
    if (!name) return;

    // Match an existing out-of-stock game by name (so it merges quantity
    // with itself), otherwise treat it as a free-text request -- the
    // player can ask about any game, not just the ones already listed.
    const known = outOfStockGames.find(
      (g) => g.name.toLowerCase() === name.toLowerCase()
    );
    const id = known?.id ?? name.toLowerCase();
    const displayName = known?.name ?? name;

    setOrderItems((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id, name: displayName, quantity: 1 }];
    });
    playMenuConfirmSound();
    setQuery("");
  };

  const removeItem = (id: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  };

  const sendOrder = () => {
    setOrderItems([]);
    close();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={close}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Pedir juegos</h2>
          <button className={styles.closeButton} onClick={close}>
            ESC
          </button>
        </div>
        <p className={styles.hint}>
          Escribi el nombre de un juego para pedirlo o preguntar si lo
          conseguimos -- no hace falta que este en la lista.
        </p>

        <div className={styles.pickerRow}>
          <input
            type="text"
            autoFocus
            list="ordertruck-suggestions"
            className={styles.picker}
            placeholder="Nombre del juego..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addFromQuery();
            }}
          />
          <datalist id="ordertruck-suggestions">
            {outOfStockGames.map((game) => (
              <option key={game.id} value={game.name} />
            ))}
          </datalist>
          <button className={styles.addButton} onClick={addFromQuery}>
            Agregar
          </button>
        </div>

        {orderItems.length === 0 ? (
          <p className={styles.emptyMessage}>
            Todavia no agregaste ningun juego al pedido.
          </p>
        ) : (
          <>
            <ul className={styles.itemList}>
              {orderItems.map((item) => (
                <li key={item.id} className={styles.item}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemQuantity}>x{item.quantity}</span>
                  <button
                    className={styles.removeButton}
                    onClick={() => removeItem(item.id)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
            <a
              className={styles.whatsappButton}
              href={buildWhatsAppOrderUrl(orderItems)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={sendOrder}
            >
              Pedir por WhatsApp
            </a>
          </>
        )}
      </div>
    </div>
  );
}
