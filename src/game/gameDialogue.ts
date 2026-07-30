interface DescribableGame {
  description?: string;
  players?: string;
  age?: string;
  duration?: string;
}

/** Builds the dialogue-box text for a game: the description as its own
 * paragraph, followed by Edad/Jugadores/Tiempo each on their own line.
 * Returns "" if the game has no info at all. */
export function buildGameDialogue(game: DescribableGame): string {
  const parts: string[] = [];
  if (game.description) parts.push(game.description);

  const specs: string[] = [];
  if (game.age) specs.push(`Edad: desde los ${game.age.replace("+", "")} años`);
  if (game.players) specs.push(`Jugadores: ${game.players}`);
  if (game.duration) specs.push(`Tiempo: ${game.duration}`);
  if (specs.length > 0) parts.push(specs.join("\n"));

  return parts.join("\n\n");
}
