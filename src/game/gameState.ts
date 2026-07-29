/**
 * Small shared state bridge between React (cart) and Phaser (world).
 * Plain data only — no Phaser/window dependency — safe to import from
 * server-rendered components too.
 */
export const gameState = {
  hasExploredShelf: false,
  cartTotalItems: 0,
  /** Mini-combat difficulty, starts at 1 and goes up by 1 each win. */
  combatLevel: 1,
};
