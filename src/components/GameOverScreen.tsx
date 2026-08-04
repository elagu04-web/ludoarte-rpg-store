"use client";

import { useEffect, useRef, useState } from "react";
import { eventBus } from "@/game/eventBus";
import { playMenuMoveSound, playMenuConfirmSound, playMenuOpenSound } from "@/game/music";
import styles from "./GameOverScreen.module.css";

type Choice = "continue" | "end";

const OPTIONS: { id: Choice; label: string }[] = [
  { id: "continue", label: "CONTINUAR" },
  { id: "end", label: "TERMINAR" },
];

export default function GameOverScreen() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedIndexRef = useRef(0);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    const handleOpen = () => {
      setSelectedIndex(0);
      setIsOpen(true);
    };
    eventBus.on("game-over-open", handleOpen);
    return () => {
      eventBus.off("game-over-open", handleOpen);
    };
  }, []);

  useEffect(() => {
    eventBus.emit("menu-open", isOpen);
    if (isOpen) playMenuOpenSound();
  }, [isOpen]);

  const choose = (choice: Choice) => {
    playMenuConfirmSound();
    setIsOpen(false);
    eventBus.emit(choice === "continue" ? "game-over-continue" : "game-over-end");
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowUp" ||
        event.key === "a" ||
        event.key === "A" ||
        event.key === "w" ||
        event.key === "W"
      ) {
        setSelectedIndex((prev) => (prev + OPTIONS.length - 1) % OPTIONS.length);
        playMenuMoveSound();
      } else if (
        event.key === "ArrowRight" ||
        event.key === "ArrowDown" ||
        event.key === "d" ||
        event.key === "D" ||
        event.key === "s" ||
        event.key === "S"
      ) {
        setSelectedIndex((prev) => (prev + 1) % OPTIONS.length);
        playMenuMoveSound();
      } else if (event.key === "e" || event.key === "E" || event.key === "Enter") {
        choose(OPTIONS[selectedIndexRef.current].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.screen}>
      <p className={styles.title}>TE VENCIERON!</p>
      <p className={styles.subtitle}>La Tecnologia gana esta ronda.</p>

      <div className={styles.options}>
        {OPTIONS.map((option, index) => (
          <button
            key={option.id}
            className={index === selectedIndex ? styles.optionSelected : styles.option}
            onClick={() => choose(option.id)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            {index === selectedIndex ? "▶ " : "  "}
            {option.label}
          </button>
        ))}
      </div>

      <p className={styles.hint}>
        FLECHAS: ELEGIR &middot; E: CONFIRMAR
        <br />
        CONTINUAR: otra pelea &middot; TERMINAR: volver al titulo
      </p>
    </div>
  );
}
