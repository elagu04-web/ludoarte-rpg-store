import { shelves } from "./shelves";
import { rentalGames } from "./rentals";

export interface CatalogGame {
  id: string;
  name: string;
  image: string;
  /** Stock as written in the code -- the admin override (if any)
   * replaces this at render time, this is just the fallback. */
  baseStock: number;
  forSale: boolean;
  forRental: boolean;
}

// Every unique game across both catalogs, for the admin inventory list --
// sale games first (so their real stock number shows), then any
// rental-only game not already covered.
const saleGames = shelves.flatMap((shelf) => shelf.games);
const saleIds = new Set(saleGames.map((g) => g.id));

export const allGames: CatalogGame[] = [
  ...saleGames.map((g) => ({
    id: g.id,
    name: g.name,
    image: g.image,
    baseStock: g.stock,
    forSale: true,
    forRental: rentalGames.some((r) => r.id === g.id),
  })),
  ...rentalGames
    .filter((r) => !saleIds.has(r.id))
    .map((r) => ({
      id: r.id,
      name: r.name,
      image: r.image,
      baseStock: 0,
      forSale: false,
      forRental: true,
    })),
].sort((a, b) => a.name.localeCompare(b.name, "es"));
