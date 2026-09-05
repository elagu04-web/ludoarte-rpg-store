/**
 * The set of playable sprite sheets. All of them share the exact same
 * grid (84x108 per frame, 4 walking directions x 3 animation frames) so
 * they're interchangeable as far as Phaser's animations are concerned --
 * see BasePlayerScene.
 */
export type PlayerCharacterKey = "original" | "sabia" | "sabio" | "arquera";

export interface PlayerCharacterOption {
  key: PlayerCharacterKey;
  label: string;
  file: string;
  /** Whether this sprite's palette was designed to be recolored via tint.
   * The original wizard uses flat colors that take a tint well; the other
   * variants are finished artwork with their own shading and would look
   * wrong multiplied by a color. */
  tintable: boolean;
}

export const PLAYER_CHARACTERS: PlayerCharacterOption[] = [
  {
    key: "original",
    label: "Mago",
    file: "/assets/characters/player-walk-sheet.png",
    tintable: true,
  },
  {
    key: "sabia",
    label: "Sabia",
    file: "/assets/characters/player-walk-sheet-sabia.png",
    tintable: false,
  },
  {
    key: "sabio",
    label: "Sabio",
    file: "/assets/characters/player-walk-sheet-sabio.png",
    tintable: false,
  },
  {
    key: "arquera",
    label: "Arquera",
    file: "/assets/characters/player-walk-sheet-arquera.png",
    tintable: false,
  },
];

export function textureKeyFor(character: PlayerCharacterKey): string {
  return `player-walk-${character}`;
}
