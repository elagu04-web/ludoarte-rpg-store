"use client";

import { useEffect, useRef, useState } from "react";
import { eventBus } from "@/game/eventBus";
import { playDialogueBlipSound } from "@/game/music";
import styles from "./GameOverlay.module.css";

const TYPE_INTERVAL_MS = 25;

export default function GameDialogueBox() {
  const [fullText, setFullText] = useState("");
  const [visibleChars, setVisibleChars] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleDialogue = (text: string) => {
      setFullText(text);
      setVisibleChars(0);
    };
    eventBus.on("game-dialogue", handleDialogue);
    return () => {
      eventBus.off("game-dialogue", handleDialogue);
    };
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!fullText) return;

    intervalRef.current = setInterval(() => {
      setVisibleChars((prev) => {
        if (prev >= fullText.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return prev;
        }
        if (fullText[prev] !== " ") {
          playDialogueBlipSound();
        }
        return prev + 1;
      });
    }, TYPE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fullText]);

  if (!fullText) return null;

  return (
    <div className={styles.dialogueBox}>
      <p className={styles.dialogueText}>{fullText.slice(0, visibleChars)}</p>
    </div>
  );
}
