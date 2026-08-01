"use client";

import { useEffect, useRef, useState } from "react";
import { eventBus } from "@/game/eventBus";
import {
  playMenuMoveSound,
  playMenuConfirmSound,
  playMenuOpenSound,
  playMenuCloseSound,
} from "@/game/music";
import { shelves, type SpinSheet } from "@/data/shelves";
import { rentalGames } from "@/data/rentals";
import SpinningBox from "./SpinningBox";
import styles from "./GameOverlay.module.css";

const STORE_WHATSAPP_NUMBER = "59899861116";

interface TruckGame {
  id: string;
  name: string;
  price: number | null;
  image: string;
  spinSheet?: SpinSheet;
  kind: "sale" | "rental";
}

// Todo lo que no se puede llevar directo de la estanteria: los juegos a la
// venta sin stock (piden por WhatsApp) y TODOS los de alquiler (siempre se
// arreglan por pedido, tengan o no version en venta con stock real).
const saleOutOfStock: TruckGame[] = shelves
  .flatMap((shelf) => shelf.games)
  .filter((game) => game.stock === 0)
  .map((game) => ({
    id: game.id,
    name: game.name,
    price: game.price,
    image: game.image,
    spinSheet: game.spinSheet,
    kind: "sale",
  }));

const rentalEntries: TruckGame[] = rentalGames.map((game) => ({
  id: game.id,
  name: game.name,
  price: game.price,
  image: game.image,
  spinSheet: game.spinSheet,
  kind: "rental",
}));

const truckGames: TruckGame[] = [...saleOutOfStock, ...rentalEntries];

interface OrderItem {
  key: string;
  name: string;
  kind: "sale" | "rental";
  quantity: number;
}

function buildWhatsAppOrderUrl(items: OrderItem[]): string {
  const lines = items.map(
    (item) =>
      `- ${item.name} (${item.kind === "rental" ? "alquiler" : "compra"}) x${item.quantity}`
  );
  const message = [
    "Hola! Quiero pedir o consultar estos juegos:",
    ...lines,
    "Me avisan si los tienen o cuando esten disponibles?",
  ].join("\n");

  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function OrderTruckScreen() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const selectedItemRef = useRef<HTMLLIElement | null>(null);
  const selectedIndexRef = useRef(0);
  const selectedGame = truckGames[selectedIndex];

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setSelectedIndex(0);
      playMenuOpenSound();
    };
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

  const addSelectionToOrder = () => {
    const game = truckGames[selectedIndexRef.current];
    if (!game) return;

    const key = `${game.kind}-${game.id}`;
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { key, name: game.name, kind: game.kind, quantity: 1 }];
    });
    playMenuConfirmSound();
  };

  const removeItem = (key: string) => {
    setOrderItems((prev) => prev.filter((item) => item.key !== key));
  };

  const sendOrder = () => {
    setOrderItems([]);
    close();
  };

  useEffect(() => {
    if (!isOpen) return;

    const moveSelection = (delta: number) => {
      setSelectedIndex((prev) => {
        const count = truckGames.length;
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
        addSelectionToOrder();
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

    const handleTouchInteract = () => addSelectionToOrder();

    window.addEventListener("keydown", handleKeyDown);
    eventBus.on("touch-direction", handleTouchDirection);
    eventBus.on("touch-interact", handleTouchInteract);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      eventBus.off("touch-direction", handleTouchDirection);
      eventBus.off("touch-interact", handleTouchInteract);
    };
  }, [isOpen]);

  if (!isOpen || !selectedGame) return null;

  return (
    <>
      <div className={styles.spinningBoxWrapper}>
        <SpinningBox game={selectedGame} key={`${selectedGame.kind}-${selectedGame.id}`} />
      </div>

      <div className={`${styles.shopMenu} ${styles.truckMenuPanel}`}>
        <div className={styles.shopMenuTitle}>
          <span>Pedir juegos</span>
          <button className={styles.shopMenuClose} onClick={close}>
            ESC
          </button>
        </div>

        <ul className={`${styles.shopMenuList} ${styles.truckMenuList}`}>
          {truckGames.map((game, index) => (
            <li
              key={`${game.kind}-${game.id}`}
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
              onDoubleClick={() => {
                setSelectedIndex(index);
                addSelectionToOrder();
              }}
            >
              {index === selectedIndex ? "▶ " : "  "}
              {game.name}
              <span className={styles.truckMenuKindTag}>
                {game.kind === "rental" ? "alquiler" : "compra"}
              </span>
            </li>
          ))}
        </ul>

        <div className={styles.shopMenuFooter}>
          <div className={styles.shopMenuPrice}>
            {selectedGame.price !== null
              ? `$${selectedGame.price}`
              : "Consultar precio"}
          </div>
          <div className={styles.shopMenuHint}>E: Agregar &middot; ESC: Salir</div>
        </div>

        <div className={styles.truckOrderSection}>
          {orderItems.length === 0 ? (
            <p className={styles.truckOrderEmpty}>
              Todavia no agregaste ningun juego al pedido.
            </p>
          ) : (
            <>
              <ul className={styles.truckOrderList}>
                {orderItems.map((item) => (
                  <li key={item.key} className={styles.truckOrderItem}>
                    <span className={styles.truckOrderItemName}>
                      {item.name} ({item.kind === "rental" ? "alquiler" : "compra"})
                    </span>
                    <span className={styles.truckOrderItemQuantity}>
                      x{item.quantity}
                    </span>
                    <button
                      className={styles.truckOrderRemoveButton}
                      onClick={() => removeItem(item.key)}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
              <a
                className={styles.truckWhatsappButton}
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
    </>
  );
}
