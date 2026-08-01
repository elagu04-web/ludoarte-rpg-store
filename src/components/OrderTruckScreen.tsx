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
  /** Solo aparece en el catalogo de alquiler -- el precio es de alquiler,
   * no sirve para saber cuanto cuesta traerlo del proveedor. */
  isRentalOnly: boolean;
  image: string;
  spinSheet?: SpinSheet;
}

// Unicode escapes (not literal combining-mark characters) -- see the same
// note in data/rentals.ts, typing the raw diacritic range directly mangled
// that file on an encoding round-trip.
const DIACRITICS_REGEX = /[\u0300-\u036f]/g;

function normalizeName(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(DIACRITICS_REGEX, "").trim();
}

// Todo lo que hay que encargarle al proveedor: los juegos a la venta sin
// stock mas los que solo estan en el catalogo de alquiler. Un mismo juego
// puede estar en las dos listas (p. ej. Porto se vende Y se alquila) --
// aca no importa esa diferencia, es un solo pedido al proveedor, asi que
// se junta en una sola entrada (con prioridad al precio de venta si lo tiene).
const saleOutOfStock = shelves.flatMap((shelf) => shelf.games).filter((game) => game.stock === 0);

const rawTruckGames = [
  ...saleOutOfStock.map((game) => ({ ...game, isRentalOnly: false })),
  ...rentalGames.map((game) => ({ ...game, isRentalOnly: true })),
];

const truckGames: TruckGame[] = rawTruckGames.reduce<TruckGame[]>((unique, game) => {
  const key = normalizeName(game.name);
  if (unique.some((existing) => normalizeName(existing.name) === key)) return unique;
  unique.push({
    id: game.id,
    name: game.name,
    price: game.price,
    isRentalOnly: game.isRentalOnly,
    image: game.image,
    spinSheet: game.spinSheet,
  });
  return unique;
}, []);

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

type View = "menu" | "list" | "search";

interface TopMenuItem {
  id: View;
  label: string;
}

const TOP_MENU_ITEMS: TopMenuItem[] = [
  { id: "list", label: "Lista de juegos para traer" },
  { id: "search", label: "Pedir un juego en especial" },
];

export default function OrderTruckScreen() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [topMenuIndex, setTopMenuIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const viewRef = useRef<View>("menu");
  const topMenuIndexRef = useRef(0);
  const selectedItemRef = useRef<HTMLLIElement | null>(null);
  const selectedIndexRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedGame = truckGames[selectedIndex];

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    topMenuIndexRef.current = topMenuIndex;
  }, [topMenuIndex]);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setView("menu");
      setTopMenuIndex(0);
      setSelectedIndex(0);
      setSearchText("");
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

  const closeAll = () => setIsOpen(false);
  const backToMenu = () => setView("menu");

  const addGameToOrder = (id: string, name: string) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id, name, quantity: 1 }];
    });
    playMenuConfirmSound();
  };

  const addSelectionToOrder = () => {
    const game = truckGames[selectedIndexRef.current];
    if (!game) return;
    addGameToOrder(game.id, game.name);
  };

  const addSearchTextToOrder = () => {
    const name = searchText.trim();
    if (!name) return;

    // Si escribiste el nombre de un juego que ya conocemos, lo fusionamos
    // con esa entrada (mismo id); si no, es un pedido de algo puntual que
    // no esta en ningun catalogo todavia.
    const known = truckGames.find(
      (game) => normalizeName(game.name) === normalizeName(name)
    );
    addGameToOrder(known?.id ?? normalizeName(name), known?.name ?? name);
    setSearchText("");
  };

  const removeItem = (id: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  };

  const sendOrder = () => {
    setOrderItems([]);
    closeAll();
  };

  useEffect(() => {
    if (!isOpen) return;

    const moveTopMenu = (delta: number) => {
      setTopMenuIndex((prev) => (prev + delta + TOP_MENU_ITEMS.length) % TOP_MENU_ITEMS.length);
      playMenuMoveSound();
    };

    const openTopMenuSelection = () => {
      const item = TOP_MENU_ITEMS[topMenuIndexRef.current];
      setView(item.id);
      setSelectedIndex(0);
      playMenuConfirmSound();
    };

    const moveSelection = (delta: number) => {
      setSelectedIndex((prev) => {
        const count = truckGames.length;
        return (prev + delta + count) % count;
      });
      playMenuMoveSound();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const currentView = viewRef.current;

      if (currentView === "menu") {
        if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
          moveTopMenu(-1);
        } else if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
          moveTopMenu(1);
        } else if (event.key === "e" || event.key === "E" || event.key === "Enter") {
          openTopMenuSelection();
        } else if (event.key === "Escape") {
          closeAll();
        }
        return;
      }

      if (currentView === "list") {
        if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
          moveSelection(-1);
        } else if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
          moveSelection(1);
        } else if (event.key === "e" || event.key === "E" || event.key === "Enter") {
          addSelectionToOrder();
        } else if (event.key === "Escape") {
          backToMenu();
        }
        return;
      }

      // view === "search": el campo de texto ya maneja su propio Enter
      // (ver el onKeyDown del input); aca solo hace falta ESC para volver.
      if (event.key === "Escape") {
        backToMenu();
      }
    };

    const handleTouchDirection = (payload: {
      direction: "up" | "down" | "left" | "right";
      pressed: boolean;
    }) => {
      if (!payload.pressed) return;
      if (viewRef.current === "menu") {
        if (payload.direction === "up") moveTopMenu(-1);
        if (payload.direction === "down") moveTopMenu(1);
      } else if (viewRef.current === "list") {
        if (payload.direction === "up") moveSelection(-1);
        if (payload.direction === "down") moveSelection(1);
      }
    };

    const handleTouchInteract = () => {
      if (viewRef.current === "menu") openTopMenuSelection();
      else if (viewRef.current === "list") addSelectionToOrder();
    };

    window.addEventListener("keydown", handleKeyDown);
    eventBus.on("touch-direction", handleTouchDirection);
    eventBus.on("touch-interact", handleTouchInteract);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      eventBus.off("touch-direction", handleTouchDirection);
      eventBus.off("touch-interact", handleTouchInteract);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const orderSection = (
    <div className={styles.truckOrderSection}>
      {orderItems.length === 0 ? (
        <p className={styles.truckOrderEmpty}>
          Todavia no agregaste ningun juego al pedido.
        </p>
      ) : (
        <>
          <ul className={styles.truckOrderList}>
            {orderItems.map((item) => (
              <li key={item.id} className={styles.truckOrderItem}>
                <span className={styles.truckOrderItemName}>{item.name}</span>
                <span className={styles.truckOrderItemQuantity}>x{item.quantity}</span>
                <button
                  className={styles.truckOrderRemoveButton}
                  onClick={() => removeItem(item.id)}
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
  );

  if (view === "menu") {
    return (
      <div className={`${styles.shopMenu} ${styles.truckMenuPanel}`}>
        <div className={styles.shopMenuTitle}>
          <span>Pedir juegos</span>
          <button className={styles.shopMenuClose} onClick={closeAll}>
            ESC
          </button>
        </div>
        <ul className={styles.shopMenuList}>
          {TOP_MENU_ITEMS.map((item, index) => (
            <li
              key={item.id}
              className={
                index === topMenuIndex ? styles.shopMenuItemSelected : styles.shopMenuItem
              }
              onClick={() => {
                if (index !== topMenuIndexRef.current) playMenuMoveSound();
                setTopMenuIndex(index);
              }}
              onDoubleClick={() => {
                setTopMenuIndex(index);
                setView(item.id);
                setSelectedIndex(0);
                playMenuConfirmSound();
              }}
            >
              {index === topMenuIndex ? "▶ " : "  "}
              {item.label}
            </li>
          ))}
        </ul>
        <div className={styles.shopMenuFooter}>
          <div className={styles.shopMenuHint}>E: Elegir &middot; ESC: Salir</div>
        </div>
      </div>
    );
  }

  if (view === "search") {
    return (
      <div className={`${styles.shopMenu} ${styles.truckMenuPanel}`}>
        <div className={styles.shopMenuTitle}>
          <span>Pedir un juego en especial</span>
          <button className={styles.shopMenuClose} onClick={backToMenu}>
            ESC
          </button>
        </div>

        <p className={styles.truckSearchHint}>
          Escribi el nombre de un juego para pedirlo o preguntar si lo
          conseguimos -- no hace falta que este en ninguna lista.
        </p>

        <div className={styles.truckSearchRow}>
          <input
            ref={searchInputRef}
            type="text"
            autoFocus
            list="ordertruck-suggestions"
            className={styles.truckSearchInput}
            placeholder="Nombre del juego..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addSearchTextToOrder();
            }}
          />
          <datalist id="ordertruck-suggestions">
            {truckGames.map((game) => (
              <option key={game.id} value={game.name} />
            ))}
          </datalist>
          <button className={styles.truckSearchAddButton} onClick={addSearchTextToOrder}>
            Agregar
          </button>
        </div>

        {orderSection}
      </div>
    );
  }

  // view === "list"
  if (!selectedGame) return null;

  return (
    <>
      <div className={styles.spinningBoxWrapper}>
        <SpinningBox game={selectedGame} key={selectedGame.id} />
      </div>

      <div className={`${styles.shopMenu} ${styles.truckMenuPanel}`}>
        <div className={styles.shopMenuTitle}>
          <span>Lista de juegos para traer</span>
          <button className={styles.shopMenuClose} onClick={backToMenu}>
            ESC
          </button>
        </div>

        <ul className={`${styles.shopMenuList} ${styles.truckMenuList}`}>
          {truckGames.map((game, index) => (
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
              onDoubleClick={() => {
                setSelectedIndex(index);
                addSelectionToOrder();
              }}
            >
              {index === selectedIndex ? "▶ " : "  "}
              {game.name}
            </li>
          ))}
        </ul>

        <div className={styles.shopMenuFooter}>
          <div className={styles.shopMenuPrice}>
            {selectedGame.isRentalOnly ? "Consultar por WhatsApp" : `$${selectedGame.price}`}
          </div>
          <div className={styles.shopMenuHint}>E: Agregar &middot; ESC: Volver</div>
        </div>

        {orderSection}
      </div>
    </>
  );
}
