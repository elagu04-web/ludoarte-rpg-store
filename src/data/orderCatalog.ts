import { shelves, type SpinSheet } from "./shelves";
import { rentalGames } from "./rentals";

export interface OrderableGame {
  id: string;
  name: string;
  price: number | null;
  /** Solo aparece en el catalogo de alquiler -- el precio es de alquiler,
   * no sirve para saber cuanto cuesta traerlo/comprarlo. */
  isRentalOnly: boolean;
  image: string;
  spinSheet?: SpinSheet;
}

// Unicode escapes (not literal combining-mark characters) -- see the same
// note in rentals.ts, typing the raw diacritic range directly mangled that
// file on an encoding round-trip.
const DIACRITICS_REGEX = /[\u0300-\u036f]/g;

function normalizeName(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(DIACRITICS_REGEX, "").trim();
}

// Todo lo que no se puede llevar directo de una estanteria: los juegos a
// la venta sin stock, mas los que solo estan en el catalogo de alquiler.
// Un mismo juego puede estar en las dos listas (p. ej. Porto se vende Y
// se alquila) -- aca no importa esa diferencia, es un solo pedido, asi
// que se junta en una sola entrada (con prioridad al precio de venta si
// lo tiene). Usado tanto por el camion de pedidos como por la pestaña
// "Por pedido" del Modo Tienda.
const saleOutOfStock = shelves
  .flatMap((shelf) => shelf.games)
  .filter((game) => game.stock === 0);

const rawOrderableGames = [
  ...saleOutOfStock.map((game) => ({ ...game, isRentalOnly: false })),
  ...rentalGames.map((game) => ({ ...game, isRentalOnly: true })),
];

export const orderableGames: OrderableGame[] = rawOrderableGames.reduce<OrderableGame[]>(
  (unique, game) => {
    const key = normalizeName(game.name);
    if (unique.some((existing) => normalizeName(existing.name) === key)) return unique;
    unique.push({
      id: game.id,
      name: game.name,
      price: game.price,
      isRentalOnly: game.isRentalOnly,
      image: game.image,
      spinSheet: game.spinSheet,
    });
    return unique;
  },
  []
);

export { normalizeName };
