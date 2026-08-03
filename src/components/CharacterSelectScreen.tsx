"use client";

import { useEffect, useRef, useState } from "react";
import { playMenuMoveSound, playMenuConfirmSound } from "@/game/music";
import styles from "./CharacterSelectScreen.module.css";

const FRAME_WIDTH = 84;
const FRAME_HEIGHT = 108;
// Frame 1 of the walk sheet -- the idle-down pose (see IDLE_FRAME in
// BasePlayerScene), sitting in column 1 of row 0.
const PREVIEW_FRAME_X = FRAME_WIDTH;

interface ColorOption {
  name: string;
  tint: number;
}

const COLORS: ColorOption[] = [
  { name: "Verde (original)", tint: 0xffffff },
  { name: "Rojo", tint: 0xff6b6b },
  { name: "Azul", tint: 0x5b8dff },
  { name: "Morado", tint: 0xb15bff },
  { name: "Dorado", tint: 0xf5d060 },
  { name: "Gris", tint: 0xb0b0b0 },
];

function renderTinted(canvas: HTMLCanvasElement, frame: ImageData, tint: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const tr = (tint >> 16) & 0xff;
  const tg = (tint >> 8) & 0xff;
  const tb = tint & 0xff;
  const output = ctx.createImageData(frame.width, frame.height);
  for (let i = 0; i < frame.data.length; i += 4) {
    output.data[i] = (frame.data[i] * tr) / 255;
    output.data[i + 1] = (frame.data[i + 1] * tg) / 255;
    output.data[i + 2] = (frame.data[i + 2] * tb) / 255;
    output.data[i + 3] = frame.data[i + 3];
  }
  ctx.putImageData(output, 0, 0);
}

export default function CharacterSelectScreen({
  onConfirm,
  onCancel,
}: {
  onConfirm: (tint: number) => void;
  onCancel?: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [frameData, setFrameData] = useState<ImageData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedIndexRef = useRef(0);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    const img = new Image();
    img.src = "/assets/characters/player-walk-sheet.png";
    img.onload = () => {
      const off = document.createElement("canvas");
      off.width = FRAME_WIDTH;
      off.height = FRAME_HEIGHT;
      const ctx = off.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(
        img,
        PREVIEW_FRAME_X,
        0,
        FRAME_WIDTH,
        FRAME_HEIGHT,
        0,
        0,
        FRAME_WIDTH,
        FRAME_HEIGHT
      );
      setFrameData(ctx.getImageData(0, 0, FRAME_WIDTH, FRAME_HEIGHT));
    };
  }, []);

  useEffect(() => {
    if (!frameData || !canvasRef.current) return;
    renderTinted(canvasRef.current, frameData, COLORS[selectedIndex].tint);
  }, [frameData, selectedIndex]);

  const cycle = (delta: number) => {
    setSelectedIndex((prev) => (prev + delta + COLORS.length) % COLORS.length);
    playMenuMoveSound();
  };

  const confirm = () => {
    playMenuConfirmSound();
    onConfirm(COLORS[selectedIndexRef.current].tint);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        cycle(-1);
      } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
        cycle(1);
      } else if (event.key === "e" || event.key === "E" || event.key === "Enter") {
        confirm();
      } else if (event.key === "Escape" && onCancel) {
        playMenuMoveSound();
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.screen}>
      <p className={styles.title}>ELEGI TU PERSONAJE</p>
      <p className={styles.subtitle}>MAGO</p>

      <div className={styles.previewWrapper}>
        <canvas
          ref={canvasRef}
          width={FRAME_WIDTH}
          height={FRAME_HEIGHT}
          className={styles.preview}
        />
      </div>

      <div className={styles.colorRow}>
        <button className={styles.arrowButton} onClick={() => cycle(-1)}>
          ◀
        </button>
        <span className={styles.colorName}>{COLORS[selectedIndex].name}</span>
        <button className={styles.arrowButton} onClick={() => cycle(1)}>
          ▶
        </button>
      </div>

      <div className={styles.actions}>
        <button className={styles.confirmButton} onClick={confirm}>
          CONFIRMAR (E)
        </button>
        {onCancel && (
          <button className={styles.cancelButton} onClick={onCancel}>
            VOLVER (ESC)
          </button>
        )}
      </div>

      <p className={styles.hint}>
        FLECHAS: CAMBIAR COLOR &middot; E: CONFIRMAR
        {onCancel ? " · ESC: VOLVER" : ""}
      </p>
    </div>
  );
}
