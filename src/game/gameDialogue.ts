interface DescribableGame {
  description?: string;
  players?: string;
  age?: string;
  duration?: string;
}

/** Builds the flowing dialogue-box sentence for a game, or "" if it has no info. */
export function buildGameDialogue(game: DescribableGame): string {
  const parts: string[] = [];
  if (game.description) parts.push(game.description);

  const specs: string[] = [];
  if (game.players) specs.push(`${game.players} jugadores`);
  if (game.age) specs.push(`desde los ${game.age.replace("+", "")} años`);
  if (game.duration) specs.push(`dura ${game.duration}`);
  if (specs.length > 0) parts.push(`${specs.join(", ")}.`);

  return parts.join(" ");
}
