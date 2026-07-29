"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { BoardGame } from "@/data/shelves";
import { gameState } from "@/game/gameState";

interface CartItem extends BoardGame {
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (game: BoardGame) => void;
  decreaseItem: (gameId: string) => void;
  removeItem: (gameId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addItem = (game: BoardGame) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === game.id);
      if (existing) {
        return prev.map((item) =>
          item.id === game.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...game, quantity: 1 }];
    });
  };

  const decreaseItem = (gameId: string) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === gameId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (gameId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== gameId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  useEffect(() => {
    gameState.cartTotalItems = totalItems;
  }, [totalItems]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        decreaseItem,
        removeItem,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de un CartProvider");
  }
  return context;
}
