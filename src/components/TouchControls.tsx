"use client";

import { useEffect, useState } from "react";
import { eventBus } from "@/game/eventBus";
import styles from "./GameOverlay.module.css";

type TouchDirection = "up" | "down" | "left" | "right";

function emitDirection(direction: TouchDirection, pressed: boolean) {
  eventBus.emit("touch-direction", { direction, pressed });
}

function DirectionButton({
  direction,
  label,
  className,
}: {
  direction: TouchDirection;
  label: string;
  className: string;
}) {
  return (
    <button
      className={`${styles.dpadButton} ${className}`}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        emitDirection(direction, true);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        e.stopPropagation();
        emitDirection(direction, false);
      }}
      onPointerLeave={() => emitDirection(direction, false)}
      onPointerCancel={() => emitDirection(direction, false)}
    >
      {label}
    </button>
  );
}

export default function TouchControls() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleMenuOpen = (open: boolean) => setMenuOpen(open);
    eventBus.on("menu-open", handleMenuOpen);
    return () => {
      eventBus.off("menu-open", handleMenuOpen);
    };
  }, []);

  // A menu covers part of the screen but not necessarily the corners where
  // the D-pad/interact button live -- leaving them tappable underneath let
  // a touch meant for a menu button also queue up a move/interact.
  if (menuOpen) return null;

  return (
    <div className={styles.touchControls}>
      <div className={styles.dpad}>
        <DirectionButton direction="up" label="^" className={styles.dpadUp} />
        <DirectionButton
          direction="left"
          label="<"
          className={styles.dpadLeft}
        />
        <DirectionButton
          direction="right"
          label=">"
          className={styles.dpadRight}
        />
        <DirectionButton
          direction="down"
          label="v"
          className={styles.dpadDown}
        />
      </div>
      <button
        className={styles.interactButton}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          eventBus.emit("touch-interact");
        }}
      >
        E
      </button>
    </div>
  );
}
