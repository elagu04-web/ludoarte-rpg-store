"use client";

import { useEffect, useRef, useState } from "react";
import { eventBus } from "@/game/eventBus";
import {
  playMenuMoveSound,
  playMenuConfirmSound,
  playMenuOpenSound,
  playMenuCloseSound,
} from "@/game/music";
import styles from "./SecondHandNpcPrompt.module.css";

type Choice = "yes" | "no";

const OPTIONS: { id: Choice; label: string }[] = [
  { id: "yes", label: "SI" },
  { id: "no", label: "NO" },
];

const NPC_IMAGE =
  "/assets/NPC/personaje-encapuchado-entrenador-pixel-art-chibi-transparente.png";

/** Forced Si/No prompt from the bathroom NPC -- BathroomScene opens this
 * automatically on proximity (no E press needed), matching the "nos
 * obligue a leer" ask. Choosing "Si" hands off to SecondHandMenu. */
export default function SecondHandNpcPrompt() {
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
    eventBus.on("npc-prompt-open", handleOpen);
    return () => {
      eventBus.off("npc-prompt-open", handleOpen);
    };
  }, []);

  useEffect(() => {
    eventBus.emit("menu-open", isOpen);
    if (isOpen) playMenuOpenSound();
  }, [isOpen]);

  const choose = (choice: Choice) => {
    playMenuConfirmSound();
    setIsOpen(false);
    if (choice === "yes") {
      eventBus.emit("second-hand-open", true);
    } else {
      playMenuCloseSound();
    }
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
      } else if (event.key === "Escape") {
        choose("no");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.screen}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={NPC_IMAGE} alt="" className={styles.npcImage} />
      <p className={styles.question}>¿Querés comprar jueguitos usados?</p>

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

      <p className={styles.hint}>FLECHAS: ELEGIR &middot; E: CONFIRMAR</p>
    </div>
  );
}
