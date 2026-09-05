import type { PlayerCharacterKey } from "@/game/characters";

/**
 * Small shared state bridge between React (cart) and Phaser (world).
 * Plain data only — no Phaser/window dependency — safe to import from
 * server-rendered components too.
 */
export const gameState = {
  hasExploredShelf: false,
  cartTotalItems: 0,
  /** How many monsters spawn in the next encounter. Goes up each time you
   * escape a fight through a door instead of finishing it; resets to 1
   * after a win. */
  pendingMonsters: 1,
  /** Tint applied to the player sprite (0xffffff = no tint, original colors).
   * Only has a visible effect when playerCharacter is tintable. */
  playerTint: 0xffffff,
  /** Which sprite sheet the player character uses. */
  playerCharacter: "original" as PlayerCharacterKey,
};
