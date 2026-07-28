"use client";

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
        emitDirection(direction, true);
      }}
      onPointerUp={() => emitDirection(direction, false)}
      onPointerLeave={() => emitDirection(direction, false)}
      onPointerCancel={() => emitDirection(direction, false)}
    >
      {label}
    </button>
  );
}

export default function TouchControls() {
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
        onClick={() => eventBus.emit("touch-interact")}
      >
        E
      </button>
    </div>
  );
}
