import { shelves } from "./shelves";
import { rentalGames } from "./rentals";

export interface CatalogGame {
  id: string;
  name: string;
  image: string;
  /** Stock as written in the code -- the admin override (if any)
   * replaces this at render time, this is just the fallback. */
  baseStock: number;
  /** Precio como esta en el codigo -- null para juegos que solo se
   * alquilan y todavia no tienen un precio de referencia (salePrice). */
  basePrice: number | null;
  /** Precio de alquiler como esta en el codigo (RentalGame.price) --
   * null si el juego no se alquila o todavia no se cargo el precio. */
  baseRentalPrice: number | null;
  forSale: boolean;
  forRental: boolean;
}

// Every unique game across both catalogs, for the admin inventory list --
// sale games first (so their real stock number shows), then any
// rental-only game not already covered.
const saleGames = shelves.flatMap((shelf) => shelf.games);
const saleIds = new Set(saleGames.map((g) => g.id));

function findRentalPrice(id: string): number | null {
  return rentalGames.find((r) => r.id === id)?.price ?? null;
}

export const allGames: CatalogGame[] = [
  ...saleGames.map((g) => ({
    id: g.id,
    name: g.name,
    image: g.image,
    baseStock: g.stock,
    basePrice: g.price,
    baseRentalPrice: findRentalPrice(g.id),
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
      basePrice: r.salePrice ?? null,
      baseRentalPrice: r.price,
      forSale: false,
      forRental: true,
    })),
].sort((a, b) => a.name.localeCompare(b.name, "es"));
