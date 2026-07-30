import Image from "next/image";
import type { CSSProperties } from "react";
import type { SpinSheet } from "@/data/shelves";
import styles from "./GameOverlay.module.css";

const SPIN_SHEET_DISPLAY_SCALE = 0.5;

interface SpinnableGame {
  id: string;
  name: string;
  image: string;
  spinSheet?: SpinSheet;
}

/** Spinning box art shown next to a game menu: a real 360-degree sprite
 * sheet if the game has one, otherwise a CSS 3D rotation of the flat box
 * image. */
export default function SpinningBox({ game }: { game: SpinnableGame }) {
  const { spinSheet } = game;

  if (spinSheet) {
    const displayWidth = spinSheet.frameWidth * SPIN_SHEET_DISPLAY_SCALE;
    const displayHeight = spinSheet.frameHeight * SPIN_SHEET_DISPLAY_SCALE;

    return (
      <div
        className={styles.spinSheetBox}
        style={
          {
            width: displayWidth,
            height: displayHeight,
            backgroundImage: `url(${spinSheet.path})`,
            backgroundSize: `${spinSheet.columns * displayWidth}px ${
              spinSheet.rows * displayHeight
            }px`,
            "--frame-w": `${displayWidth}px`,
            "--frame-h": `${displayHeight}px`,
          } as CSSProperties
        }
      />
    );
  }

  return (
    <div className={styles.spinningBox}>
      <Image src={game.image} alt={game.name} width={230} height={275} />
    </div>
  );
}
