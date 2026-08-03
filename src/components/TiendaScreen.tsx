"use client";

import { useEffect, useRef, useState } from "react";
import { shelves, type BoardGame } from "@/data/shelves";
import { orderableGames, normalizeName, type OrderableGame } from "@/data/orderCatalog";
import { useCart } from "@/context/CartContext";
import {
  playMenuMoveSound,
  playMenuConfirmSound,
  playMenuOpenSound,
  playMenuCloseSound,
} from "@/game/music";
import styles from "./TiendaScreen.module.css";

const STORE_WHATSAPP_NUMBER = "59899861116";

type Tab = "disponible" | "pedido" | "buscador";

const TABS: { id: Tab; label: string }[] = [
  { id: "disponible", label: "DISPONIBLE" },
  { id: "pedido", label: "POR PEDIDO" },
  { id: "buscador", label: "BUSCADOR" },
];

interface FlatEntry {
  game: BoardGame;
  shelfTitle: string;
  isFirstInShelf: boolean;
}

const AVAILABLE_GAMES: FlatEntry[] = shelves.flatMap((shelf) =>
  shelf.games
    .filter((game) => game.stock > 0)
    .map((game, i) => ({
      game,
      shelfTitle: shelf.title,
      isFirstInShelf: i === 0,
    }))
);

function buildSingleItemWhatsAppUrl(name: string, price: number | null): string {
  const priceText = price !== null ? ` ($${price})` : "";
  const message = [
    "Hola! Quiero pedir o consultar este juego:",
    `- ${name}${priceText}`,
    "Me avisan si lo tienen o cuando esta disponible?",
  ].join("\n");
  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function TiendaScreen({ onExit }: { onExit: () => void }) {
  const { addItem, totalItems, openCart } = useCart();
  const [tab, setTab] = useState<Tab>("disponible");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchText, setSearchText] = useState("");

  const tabRef = useRef<Tab>("disponible");
  const selectedIndexRef = useRef(0);
  const selectedItemRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [tab]);

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, tab]);

  useEffect(() => {
    playMenuOpenSound();
  }, []);

  const list = tab === "disponible" ? AVAILABLE_GAMES : null;
  const orderList = tab === "pedido" ? orderableGames : null;
  const selectedAvailable = list?.[selectedIndex]?.game;
  const selectedOrderable = orderList?.[selectedIndex];

  const buyNow = (game: BoardGame) => {
    addItem(game);
    playMenuConfirmSound();
  };

  const requestByWhatsApp = (name: string, price: number | null) => {
    playMenuConfirmSound();
    window.open(buildSingleItemWhatsAppUrl(name, price), "_blank", "noopener,noreferrer");
  };

  const submitSearch = () => {
    const name = searchText.trim();
    if (!name) return;
    const known = orderableGames.find(
      (g) => normalizeName(g.name) === normalizeName(name)
    );
    requestByWhatsApp(known?.name ?? name, known?.price ?? null);
    setSearchText("");
  };

  const confirmSelection = () => {
    if (tab === "disponible") {
      const game = AVAILABLE_GAMES[selectedIndexRef.current]?.game;
      if (game) buyNow(game);
    } else if (tab === "pedido") {
      const game = orderableGames[selectedIndexRef.current];
      if (game) requestByWhatsApp(game.name, game.isRentalOnly ? null : game.price);
    }
  };

  const exit = () => {
    playMenuCloseSound();
    onExit();
  };

  useEffect(() => {
    const moveSelection = (delta: number) => {
      const count = tabRef.current === "disponible" ? AVAILABLE_GAMES.length : orderableGames.length;
      if (count === 0) return;
      setSelectedIndex((prev) => (prev + delta + count) % count);
      playMenuMoveSound();
    };

    const changeTab = (delta: number) => {
      const currentIndex = TABS.findIndex((t) => t.id === tabRef.current);
      const nextIndex = (currentIndex + delta + TABS.length) % TABS.length;
      setTab(TABS[nextIndex].id);
      playMenuMoveSound();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (tabRef.current === "buscador" && document.activeElement === searchInputRef.current) {
        if (event.key === "Escape") exit();
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        changeTab(-1);
      } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
        changeTab(1);
      } else if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
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

  const selectRow = (index: number) => {
    if (index !== selectedIndexRef.current) playMenuMoveSound();
    setSelectedIndex(index);
  };

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

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={t.id === tab ? styles.tabSelected : styles.tab}
            onClick={() => {
              if (t.id !== tab) playMenuMoveSound();
              setTab(t.id);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "buscador" ? (
        <div className={styles.searchBody}>
          <p className={styles.searchHint}>
            Escribi el nombre de un juego para pedirlo o preguntar si lo
            conseguimos -- no hace falta que este en ninguna lista.
          </p>
          <div className={styles.searchRow}>
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Nombre del juego..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch();
              }}
            />
            <button className={styles.searchButton} onClick={submitSearch}>
              PEDIR POR WHATSAPP
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.body}>
          <div className={styles.preview}>
            {tab === "disponible" && selectedAvailable && (
              <>
                <div className={styles.previewImageWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedAvailable.image}
                    alt={selectedAvailable.name}
                    className={styles.previewImage}
                  />
                </div>
                <p className={styles.previewName}>{selectedAvailable.name}</p>
                {selectedAvailable.description && (
                  <p className={styles.previewDescription}>
                    {selectedAvailable.description}
                  </p>
                )}
                <div className={styles.previewSpecs}>
                  {selectedAvailable.players && <span>JUGADORES: {selectedAvailable.players}</span>}
                  {selectedAvailable.age && <span>EDAD: {selectedAvailable.age}</span>}
                  {selectedAvailable.duration && <span>TIEMPO: {selectedAvailable.duration}</span>}
                </div>
                <div className={styles.previewFooter}>
                  <span className={styles.previewPrice}>${selectedAvailable.price}</span>
                  <button
                    className={styles.buyButton}
                    onClick={() => buyNow(selectedAvailable)}
                  >
                    COMPRAR (E)
                  </button>
                </div>
              </>
            )}

            {tab === "pedido" && selectedOrderable && (
              <>
                <div className={styles.previewImageWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedOrderable.image}
                    alt={selectedOrderable.name}
                    className={styles.previewImage}
                  />
                </div>
                <p className={styles.previewName}>{selectedOrderable.name}</p>
                <p className={styles.requestHint}>
                  Se lo traemos -- consultanos por WhatsApp
                </p>
                <div className={styles.previewFooter}>
                  <span className={styles.previewPrice}>
                    {selectedOrderable.isRentalOnly
                      ? "Consultar"
                      : `$${selectedOrderable.price}`}
                  </span>
                  <button
                    className={styles.requestButton}
                    onClick={() =>
                      requestByWhatsApp(
                        selectedOrderable.name,
                        selectedOrderable.isRentalOnly ? null : selectedOrderable.price
                      )
                    }
                  >
                    PEDIR (E)
                  </button>
                </div>
              </>
            )}
          </div>

          {tab === "disponible" && (
            <ul className={styles.list}>
              {AVAILABLE_GAMES.map(({ game, shelfTitle, isFirstInShelf }, index) => (
                <li key={game.id}>
                  {isFirstInShelf && (
                    <div className={styles.listHeader}>{shelfTitle.toUpperCase()}</div>
                  )}
                  <div
                    ref={index === selectedIndex ? selectedItemRef : undefined}
                    className={index === selectedIndex ? styles.rowSelected : styles.row}
                    onClick={() => selectRow(index)}
                    onDoubleClick={() => buyNow(game)}
                  >
                    <span className={styles.rowName}>
                      {index === selectedIndex ? "▶ " : "  "}
                      {game.name}
                    </span>
                    <span className={styles.rowPrice}>${game.price}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {tab === "pedido" && (
            <ul className={styles.list}>
              {orderableGames.map((game, index) => (
                <li key={game.id}>
                  <div
                    ref={index === selectedIndex ? selectedItemRef : undefined}
                    className={index === selectedIndex ? styles.rowSelected : styles.row}
                    onClick={() => selectRow(index)}
                    onDoubleClick={() =>
                      requestByWhatsApp(game.name, game.isRentalOnly ? null : game.price)
                    }
                  >
                    <span className={styles.rowName}>
                      {index === selectedIndex ? "▶ " : "  "}
                      {game.name}
                    </span>
                    <span className={styles.rowPrice}>
                      {game.isRentalOnly ? "CONSULTAR" : `$${game.price}`}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className={styles.hint}>
        FLECHAS: ELEGIR &middot; A/D: PESTAÑA &middot; E: {tab === "disponible" ? "COMPRAR" : "PEDIR"}
      </p>
    </div>
  );
}
