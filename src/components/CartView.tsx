"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { eventBus } from "@/game/eventBus";
import { playMenuOpenSound, playMenuCloseSound } from "@/game/music";
import { useCart } from "@/context/CartContext";
import styles from "./CartView.module.css";

const STORE_WHATSAPP_NUMBER = "59899861116";

function buildWhatsAppOrderUrl(
  items: { name: string; quantity: number; price: number }[],
  totalPrice: number
): string {
  const lines = items.map(
    (item) => `- ${item.name} x${item.quantity} ($${item.price * item.quantity})`
  );
  const message = [
    "Hola! Quiero comprar:",
    ...lines,
    `Total: $${totalPrice}`,
  ].join("\n");

  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function CartView() {
  const {
    items,
    isCartOpen,
    closeCart,
    openCart,
    addItem,
    decreaseItem,
    removeItem,
    clearCart,
    totalPrice,
  } = useCart();
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const payWithMercadoPago = async () => {
    setIsPaying(true);
    setPayError(null);
    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || typeof data.initPoint !== "string") {
        setPayError("No se pudo iniciar el pago. Intenta de nuevo.");
        setIsPaying(false);
        return;
      }
      // Carrito se vacia solo -- la redireccion navega fuera del sitio y
      // Mercado Pago te trae de vuelta a la pagina de inicio, donde el
      // carrito arranca vacio de todos modos.
      window.location.href = data.initPoint;
    } catch {
      setPayError("No se pudo iniciar el pago. Intenta de nuevo.");
      setIsPaying(false);
    }
  };

  useEffect(() => {
    eventBus.emit("menu-open", isCartOpen);
  }, [isCartOpen]);

  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (isCartOpen && !wasOpenRef.current) {
      playMenuOpenSound();
    } else if (!isCartOpen && wasOpenRef.current) {
      playMenuCloseSound();
    }
    wasOpenRef.current = isCartOpen;
  }, [isCartOpen]);

  useEffect(() => {
    if (!isCartOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCartOpen, closeCart]);

  useEffect(() => {
    const handleOpenRequest = () => openCart();
    eventBus.on("cart-open-request", handleOpenRequest);
    return () => {
      eventBus.off("cart-open-request", handleOpenRequest);
    };
  }, [openCart]);

  if (!isCartOpen) return null;

  return (
    <div className={styles.backdrop} onClick={closeCart}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Tu carrito</h2>
          <button className={styles.closeButton} onClick={closeCart}>
            ESC
          </button>
        </div>

        {items.length === 0 ? (
          <p className={styles.emptyMessage}>
            Todavia no agregaste ningun juego.
          </p>
        ) : (
          <>
            <ul className={styles.itemList}>
              {items.map((item) => (
                <li key={item.id} className={styles.item}>
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={56}
                    height={56}
                    className={styles.itemImage}
                  />
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemPrice}>${item.price} c/u</span>
                  </div>
                  <div className={styles.quantityControls}>
                    <button onClick={() => decreaseItem(item.id)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => addItem(item)}>+</button>
                  </div>
                  <div className={styles.itemSubtotal}>
                    ${item.price * item.quantity}
                  </div>
                  <button
                    className={styles.removeButton}
                    onClick={() => removeItem(item.id)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
            <div className={styles.total}>
              <span>Total</span>
              <span>${totalPrice}</span>
            </div>
            <button
              className={styles.mercadoPagoButton}
              onClick={payWithMercadoPago}
              disabled={isPaying}
            >
              {isPaying ? "Redirigiendo..." : "Pagar con Mercado Pago"}
            </button>
            {payError && <p className={styles.payError}>{payError}</p>}
            <a
              className={styles.whatsappButton}
              href={buildWhatsAppOrderUrl(items, totalPrice)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                clearCart();
                closeCart();
              }}
            >
              Comprar por WhatsApp
            </a>
          </>
        )}
      </div>
    </div>
  );
}
