"use client";

import { useEffect, useRef, useState } from "react";
import { eventBus } from "@/game/eventBus";
import {
  playMenuOpenSound,
  playMenuCloseSound,
  startLoreMusic,
  stopLoreMusic,
} from "@/game/music";
import styles from "./LoreScreen.module.css";

const LORE_TEXT = `AÑO 2026

LOS CELULARES GANARON.

La humanidad pasó generaciones mirando pantallas de seis
pulgadas... hasta que las pantallas empezaron a mirar de vuelta.

Pero en un rincón de Épico Atlántida, algo resistió: LUDOARTE.

El último refugio donde la gente se sienta cara a cara
y tira un dado de verdad.

El mundo se salva conectando entre nosotros, con actividades
sanas que sumen a nuestras vidas.

Pero la Tecnología no piensa dejarte ganar tan fácil: corrompió
algunos juegos para que no llegues a la ludoteca.

Cada caja que camina sola ahí afuera ya no es un juego:
es un monstruo.

Tu misión, mago sin señal: cruza la plaza y llega a Ludoarte.

El mundo no se salva solo. Se salva jugando.`;

// Keep this in sync with the "crawlUp" animation duration in
// LoreScreen.module.css -- it's how "leiste el 100%" is measured.
const CRAWL_DURATION_MS = 65000;
// Chance of a monster ambushing you right as you leave, IF you waited
// for the whole crawl. Leaving earlier scales it down proportionally to
// how much you actually watched -- barely peek and the risk is near zero.
const MAX_AMBUSH_CHANCE = 0.1;

export default function LoreScreen() {
  const [isOpen, setIsOpen] = useState(false);
  const openedAtRef = useRef<number | null>(null);

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
      startLoreMusic();
      openedAtRef.current = Date.now();
    } else if (!isOpen && wasOpenRef.current) {
      playMenuCloseSound();
      stopLoreMusic();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    return () => stopLoreMusic();
  }, []);

  const close = () => {
    playMenuCloseSound();

    const elapsed = openedAtRef.current ? Date.now() - openedAtRef.current : 0;
    const readFraction = Math.min(elapsed / CRAWL_DURATION_MS, 1);
    if (Math.random() < MAX_AMBUSH_CHANCE * readFraction) {
      eventBus.emit("lore-ambush");
    }

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
