"use client";

import { useEffect } from "react";
import Image from "next/image";
import { eventBus } from "@/game/eventBus";
import { useCart } from "@/context/CartContext";
import styles from "./CartView.module.css";

export default function CartView() {
  const {
    items,
    isCartOpen,
    closeCart,
    addItem,
    decreaseItem,
    removeItem,
    totalPrice,
  } = useCart();

  useEffect(() => {
    eventBus.emit("menu-open", isCartOpen);
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
          </>
        )}
      </div>
    </div>
  );
}
