"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./OrdersScreen.module.css";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderRow {
  id: number;
  mp_payment_id: string;
  status: string;
  items: OrderItem[];
  total: number;
  created_at: string;
}

export default function OrdersScreen({ onExit }: { onExit: () => void }) {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .from("orders")
      .select("id, mp_payment_id, status, items, total, created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setOrders(data ?? []);
      });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExit();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit]);

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <span className={styles.title}>PEDIDOS PAGADOS</span>
        <button className={styles.exitButton} onClick={onExit}>
          SALIR (ESC)
        </button>
      </div>

      {error && <p className={styles.error}>Error: {error}</p>}
      {!orders && !error && <p className={styles.hint}>Cargando...</p>}

      {orders && orders.length === 0 && (
        <p className={styles.hint}>Todavia no hay ningun pedido pagado.</p>
      )}

      {orders && orders.length > 0 && (
        <div className={styles.list}>
          {orders.map((order) => (
            <div key={order.id} className={styles.order}>
              <div className={styles.orderHeader}>
                <span className={styles.orderDate}>
                  {new Date(order.created_at).toLocaleString("es-UY")}
                </span>
                <span className={styles.orderTotal}>${order.total}</span>
              </div>
              <ul className={styles.itemsList}>
                {order.items.map((item, i) => (
                  <li key={i}>
                    {item.name} x{item.quantity} (${item.price * item.quantity})
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
