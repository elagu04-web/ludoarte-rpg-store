"use client";

import { useCart } from "@/context/CartContext";
import styles from "./CartView.module.css";

export default function CartBadge() {
  const { totalItems, openCart } = useCart();

  return (
    <button className={styles.cartBadge} onClick={openCart}>
      Carrito: {totalItems} {totalItems === 1 ? "juego" : "juegos"}
    </button>
  );
}
