/**
 * Small shared state bridge between React (cart) and Phaser (world).
 * Plain data only — no Phaser/window dependency — safe to import from
 * server-rendered components too.
 */
export const gameState = {
  hasExploredShelf: false,
  cartTotalItems: 0,
};
