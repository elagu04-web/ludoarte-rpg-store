"use client";

import { useEffect, useState } from "react";
import styles from "./PaymentResultBanner.module.css";

type Result = "exitoso" | "fallido" | "pendiente";

const MESSAGES: Record<Result, { title: string; body: string; color: string }> = {
  exitoso: {
    title: "¡Pago aprobado!",
    body: "Gracias por tu compra -- pasa por Ludoarte a retirar tus juegos.",
    color: "#2f9e44",
  },
  fallido: {
    title: "El pago no se pudo procesar",
    body: "Intenta de nuevo, o escribinos por WhatsApp si el problema sigue.",
    color: "#cc4444",
  },
  pendiente: {
    title: "Pago pendiente",
    body: "Te vamos a confirmar apenas Mercado Pago termine de procesarlo.",
    color: "#f5a524",
  },
};

/** Lee ?pago=exitoso|fallido|pendiente al volver de Mercado Pago (back_urls
 * en /api/create-payment) y muestra un aviso -- despues limpia el query
 * param para que no vuelva a aparecer si se recarga la pagina. Se lee
 * window.location directo en un efecto (nada de useSearchParams) para no
 * depender de un Suspense boundary en esta pagina, que se genera estatica. */
export default function PaymentResultBanner() {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pago = params.get("pago");
    if (pago === "exitoso" || pago === "fallido" || pago === "pendiente") {
      setResult(pago);
      params.delete("pago");
      const newSearch = params.toString();
      const newUrl =
        window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
      window.history.replaceState(null, "", newUrl);
    }
  }, []);

  if (!result) return null;

  const { title, body, color } = MESSAGES[result];

  return (
    <div className={styles.backdrop} onClick={() => setResult(null)}>
      <div
        className={styles.panel}
        style={{ border: `2px solid ${color}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className={styles.title} style={{ color }}>
          {title}
        </p>
        <p className={styles.body}>{body}</p>
        <button
          className={styles.closeButton}
          style={{ background: color }}
          onClick={() => setResult(null)}
        >
          CERRAR
        </button>
      </div>
    </div>
  );
}
