"use client";

import { useEffect, useRef, useState } from "react";
import { eventBus } from "@/game/eventBus";
import styles from "./GameOverlay.module.css";

function emitAxis(x: number, y: number) {
  eventBus.emit("touch-axis", { x, y });
}

/**
 * Floating-thumb virtual joystick: drag anywhere inside the base circle
 * and the knob follows, clamped to the base's radius. Emits a continuous
 * -1..1 vector at whatever angle the thumb actually is instead of the old
 * 4-button D-pad's up/down/left/right-only movement, so both walking and
 * aiming (fireballs use the same axis) can land at any angle on mobile,
 * same as keyboard diagonals already could.
 */
function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);

  const updateFromClientPoint = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    const knob = knobRef.current;
    if (!base || !knob) return;

    const rect = base.getBoundingClientRect();
    const radius = rect.width / 2;
    const centerX = rect.left + radius;
    const centerY = rect.top + radius;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > radius) {
      dx = (dx / distance) * radius;
      dy = (dy / distance) * radius;
    }

    // The knob is centered at rest via CSS (left/top 50% + negative
    // margins) -- from that resting position, translate() just needs the
    // raw offset, not a recomputation of the center.
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    emitAxis(dx / radius, dy / radius);
  };

  const resetKnob = () => {
    const knob = knobRef.current;
    if (knob) knob.style.transform = "translate(0, 0)";
    emitAxis(0, 0);
  };

  return (
    <div
      ref={baseRef}
      className={styles.joystickBase}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        pointerIdRef.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromClientPoint(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        e.preventDefault();
        updateFromClientPoint(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        pointerIdRef.current = null;
        resetKnob();
      }}
      onPointerCancel={() => {
        pointerIdRef.current = null;
        resetKnob();
      }}
    >
      <div ref={knobRef} className={styles.joystickKnob} />
    </div>
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
  // the joystick/interact button live -- leaving them tappable underneath
  // let a touch meant for a menu button also queue up a move/interact.
  if (menuOpen) return null;

  return (
    <div className={styles.touchControls}>
      <Joystick />
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
