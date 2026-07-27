"use client";

import { useCart } from "@/context/CartContext";

export default function CartBadge() {
  const { totalItems } = useCart();

  return (
    <p>
      Carrito: {totalItems} {totalItems === 1 ? "juego" : "juegos"}
    </p>
  );
}
