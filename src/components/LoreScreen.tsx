"use client";

import { useEffect, useRef, useState } from "react";
import { eventBus } from "@/game/eventBus";
import { playMenuOpenSound, playMenuCloseSound } from "@/game/music";
import styles from "./LoreScreen.module.css";

const LORE_TEXT = `AÑO 2077

LOS CELULARES GANARON.

La humanidad paso generaciones mirando pantallas de seis pulgadas...
hasta que las pantallas empezaron a mirar de vuelta.

Las plazas quedaron vacias. Nadie recordaba como se jugaba
a algo que no vibrara en el bolsillo.

Pero en un rincon de Epico Atlantida, algo resistio.

LUDOARTE.

El ultimo refugio donde la gente todavia se sienta cara a cara,
tira un dado de verdad, y se rie sin usar un emoji.

La resistencia dice que el mundo se salva conectando entre
nosotros: con actividades sanas, que sumen de verdad a
nuestras vidas.

Pero la Tecnologia no piensa dejarte ganar tan facil.

Poseyo algunos juegos. Los corrompio. Los mando afuera a
impedir que llegues a la ludoteca.

Cada caja que camina sola ahi afuera ya no es un juego:
es un monstruo.

Tu mision, mago sin señal: cruzar la plaza, esquivar las
cajas poseidas, y llegar a Ludoarte.

El mundo no se salva solo.

Se salva jugando.`;

export default function LoreScreen() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    eventBus.on("lore-open", handleOpen);
    return () => {
      eventBus.off("lore-open", handleOpen);
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

  const close = () => {
    playMenuCloseSound();
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "e" || event.key === "E") {
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.screen}>
      <div className={styles.background} />
      <div className={styles.darkOverlay} />

      <div className={styles.crawlWrapper}>
        <pre className={styles.crawl}>{LORE_TEXT}</pre>
      </div>

      <button className={styles.exitButton} onClick={close}>
        SALIR (ESC)
      </button>
    </div>
  );
}
