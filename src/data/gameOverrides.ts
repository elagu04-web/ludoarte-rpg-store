import { createClient } from "@/lib/supabase/client";

export interface GameOverride {
  stock: number | null;
  visible: boolean;
  /** null = usar el precio del codigo (BoardGame.price o RentalGame.salePrice). */
  price: number | null;
  /** null = usar lo que dice el codigo (en que archivo esta el juego). */
  forSale: boolean | null;
  forRental: boolean | null;
}

export type GameOverrides = Map<string, GameOverride>;

// Fetched once and shared -- every screen that needs to know current
// stock/visibility asks for the same cached map instead of each doing
// its own round trip. subscribe() lets the admin's edits (which go
// through updateGameOverride below) push a fresh copy to every screen
// that's currently mounted, without a page reload.
let cache: GameOverrides | null = null;
let inflight: Promise<GameOverrides> | null = null;
const subscribers = new Set<(overrides: GameOverrides) => void>();

async function load(): Promise<GameOverrides> {
  const { data } = await createClient()
    .from("game_overrides")
    .select("id, stock, visible, price, forSale:for_sale, forRental:for_rental");

  const map: GameOverrides = new Map();
  for (const row of data ?? []) {
    map.set(row.id, {
      stock: row.stock,
      visible: row.visible,
      price: row.price,
      forSale: row.forSale,
      forRental: row.forRental,
    });
  }
  return map;
}

export async function fetchGameOverrides(): Promise<GameOverrides> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = load().then((map) => {
    cache = map;
    inflight = null;
    return map;
  });
  return inflight;
}

export function subscribeGameOverrides(
  callback: (overrides: GameOverrides) => void
): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/** Effective stock for a game whose base (code) stock is `baseStock` --
 * an admin override replaces it entirely when present. */
export function effectiveStock(
  id: string,
  baseStock: number,
  overrides: GameOverrides
): number {
  const override = overrides.get(id);
  return override?.stock ?? baseStock;
}

export function isVisible(id: string, overrides: GameOverrides): boolean {
  return overrides.get(id)?.visible ?? true;
}

/** Effective sale price for a game whose base (code) price is `basePrice`
 * (null if the code doesn't have one, e.g. a rental-only game with no
 * salePrice set) -- an admin override replaces it when present. */
export function effectivePrice(
  id: string,
  basePrice: number | null,
  overrides: GameOverrides
): number | null {
  const override = overrides.get(id);
  return override?.price ?? basePrice;
}

export function effectiveForSale(
  id: string,
  baseForSale: boolean,
  overrides: GameOverrides
): boolean {
  return overrides.get(id)?.forSale ?? baseForSale;
}

export function effectiveForRental(
  id: string,
  baseForRental: boolean,
  overrides: GameOverrides
): boolean {
  return overrides.get(id)?.forRental ?? baseForRental;
}

/** Admin-only: called from the inventory screen. RLS on the table
 * rejects this for anyone but elagu04@gmail.com regardless. */
export async function updateGameOverride(
  id: string,
  patch: Partial<GameOverride>
): Promise<{ error: string | null }> {
  const current = cache?.get(id) ?? {
    stock: null,
    visible: true,
    price: null,
    forSale: null,
    forRental: null,
  };
  const next = { ...current, ...patch };

  const { error } = await createClient().from("game_overrides").upsert({
    id,
    stock: next.stock,
    visible: next.visible,
    price: next.price,
    for_sale: next.forSale,
    for_rental: next.forRental,
  });

  if (error) return { error: error.message };

  if (cache) {
    cache.set(id, next);
    subscribers.forEach((cb) => cb(cache!));
  }
  return { error: null };
}
