import { shelves, type BoardGame } from "./shelves";
import { rentalGames, type RentalGame } from "./rentals";
import {
  effectiveStock,
  effectiveSecondHand,
  effectiveUsedPrice,
  effectiveForRental,
  effectiveRentalPrice,
  isVisible,
  type GameOverrides,
} from "./gameOverrides";
import { allGames } from "./allGames";
import type { CustomGame } from "./customGames";
import type { OrderableGame } from "./orderCatalog";

const saleIds = new Set(shelves.flatMap((shelf) => shelf.games).map((g) => g.id));

/** Rental-only games the admin turned into sellable stock from the
 * Inventory screen (raised their stock above 0 and gave them a price).
 * Until both of those are set, a rental-only game stays rental-only --
 * there's nothing to sell yet. */
export function extraSellableGames(overrides: GameOverrides): BoardGame[] {
  const result: BoardGame[] = [];
  for (const game of rentalGames) {
    if (saleIds.has(game.id)) continue;
    if (!isVisible(game.id, overrides)) continue;
    const stock = effectiveStock(game.id, 0, overrides);
    if (stock <= 0) continue;
    const price = overrides.get(game.id)?.price ?? game.salePrice ?? null;
    if (price == null) continue;
    result.push({
      id: game.id,
      name: game.name,
      price,
      image: game.image,
      stock,
      spinSheet: game.spinSheet,
      description: game.description,
      players: game.players,
      age: game.age,
      duration: game.duration,
    });
  }
  return result;
}

/** Juegos agregados a mano desde el panel admin (no existen en el codigo)
 * que ya tienen stock -- van a la tienda como cualquier otro juego de
 * venta. Los que todavia estan en 0 van a "por pedido" en vez (ver
 * customOrderableGames), asi el admin puede cargarlos de a poco. */
export function customSellableGames(customGames: CustomGame[]): BoardGame[] {
  return customGames
    .filter((game) => game.forSale && game.visible && game.stock > 0)
    .map((game) => ({
      id: game.id,
      name: game.name,
      price: game.price,
      image: game.image,
      stock: game.stock,
    }));
}

export function customOrderableGames(customGames: CustomGame[]): OrderableGame[] {
  return customGames
    .filter((game) => game.forSale && game.visible && game.stock <= 0)
    .map((game) => ({
      id: game.id,
      name: game.name,
      price: game.price,
      isRentalOnly: false,
      image: game.image,
    }));
}

/** Juegos marcados "Segunda mano" desde el panel de Inventario (cualquier
 * juego, del catalogo o agregado a mano) -- usa el precio de segunda
 * mano, no el de venta normal. El stock que se muestra es el mismo que
 * ya tiene el juego (no hay un stock aparte para la version usada). */
export function secondHandGames(
  overrides: GameOverrides,
  customGames: CustomGame[]
): BoardGame[] {
  const fromCatalog: BoardGame[] = allGames
    .filter((game) => effectiveSecondHand(game.id, overrides))
    .map((game) => ({
      id: game.id,
      name: game.name,
      price: effectiveUsedPrice(game.id, overrides) ?? 0,
      image: game.image,
      stock: effectiveStock(game.id, game.baseStock, overrides),
    }));

  const fromCustom: BoardGame[] = customGames
    .filter((game) => game.secondHand)
    .map((game) => ({
      id: game.id,
      name: game.name,
      price: game.usedPrice,
      image: game.image,
      stock: game.stock,
    }));

  return [...fromCatalog, ...fromCustom];
}

const staticRentalIds = new Set(rentalGames.map((g) => g.id));

// Para que un juego del catalogo marcado "para alquiler" desde Inventario
// (en vez de estar ya en rentals.ts) tambien muestre descripcion/jugadores/
// edad/duracion en vez de aparecer vacio -- misma idea que rentalGame()
// ya usa en rentals.ts, pero mirando directo la estanteria de venta.
const saleGamesById = new Map(
  shelves.flatMap((shelf) => shelf.games).map((game) => [game.id, game])
);

/** Catalogo completo de alquiler que ven los clientes (RentalMenu /
 * DeliveryRentalMenu): la lista fija de rentals.ts, mas cualquier juego
 * (del catalogo o agregado a mano) que el admin haya marcado "para
 * alquiler" desde el panel de Inventario -- ese switch de Inventario
 * antes no llegaba a mostrarse en ningun lado para juegos que no
 * estuvieran ya en rentals.ts. Ordenado alfabeticamente. */
export function allRentalGames(
  overrides: GameOverrides,
  customGames: CustomGame[]
): RentalGame[] {
  const fromStatic = rentalGames.filter((game) => isVisible(game.id, overrides));

  const fromCatalog: RentalGame[] = allGames
    .filter((game) => !staticRentalIds.has(game.id))
    .filter((game) => effectiveForRental(game.id, game.forRental, overrides))
    .filter((game) => isVisible(game.id, overrides))
    .map((game) => {
      const saleMatch = saleGamesById.get(game.id);
      return {
        id: game.id,
        name: game.name,
        price: effectiveRentalPrice(game.id, game.baseRentalPrice, overrides),
        image: game.image,
        spinSheet: saleMatch?.spinSheet,
        description: saleMatch?.description,
        players: saleMatch?.players,
        age: saleMatch?.age,
        duration: saleMatch?.duration,
      };
    });

  // Los agregados a mano (custom_games) todavia no tienen donde guardar
  // descripcion/jugadores/edad/duracion en la base de datos -- quedan sin
  // esos datos hasta que se sume esa columna.
  const fromCustom: RentalGame[] = customGames
    .filter((game) => game.forRental && game.visible)
    .map((game) => ({
      id: game.id,
      name: game.name,
      price: game.rentalPrice,
      image: game.image,
    }));

  return [...fromStatic, ...fromCatalog, ...fromCustom].sort((a, b) =>
    a.name.localeCompare(b.name, "es")
  );
}
