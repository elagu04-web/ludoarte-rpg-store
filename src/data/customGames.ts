import { createClient } from "@/lib/supabase/client";
import { PLACEHOLDER_IMAGE } from "./shelves";
import { allGames } from "./allGames";

const staticIds = new Set(allGames.map((g) => g.id));

export interface CustomGame {
  id: string;
  name: string;
  price: number;
  stock: number;
  visible: boolean;
  image: string;
  forSale: boolean;
  forRental: boolean;
}

// Same cache/subscribe shape as data/gameOverrides.ts -- fetched once and
// shared, admin edits push a fresh copy to every mounted screen.
let cache: CustomGame[] | null = null;
let inflight: Promise<CustomGame[]> | null = null;
const subscribers = new Set<(games: CustomGame[]) => void>();

function notify() {
  if (cache) subscribers.forEach((cb) => cb(cache!));
}

async function load(): Promise<CustomGame[]> {
  const { data } = await createClient()
    .from("custom_games")
    .select("id, name, price, stock, visible, image, forSale:for_sale, forRental:for_rental")
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function fetchCustomGames(): Promise<CustomGame[]> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = load().then((rows) => {
    cache = rows;
    inflight = null;
    return rows;
  });
  return inflight;
}

export function subscribeCustomGames(
  callback: (games: CustomGame[]) => void
): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

// Unicode escapes (not literal combining-mark characters) -- same note as
// rentals.ts/orderCatalog.ts, typing the raw diacritic range directly
// mangled those files on an encoding round-trip.
const DIACRITICS_REGEX = /[\u0300-\u036f]/g;

/** Same slug convention used everywhere else in the catalog (rentals.ts,
 * orderCatalog.ts): lowercase, no accents, non-alphanumerics -> hyphens. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

/** Where the real box-art photo needs to be saved for this game to show
 * up automatically once it's dropped in and deployed. */
export function expectedImagePath(slug: string): string {
  return `/assets/boardgames/${slug}.png`;
}

/** Admin-only: RLS rejects this for anyone but elagu04@gmail.com. Starts
 * at stock 0 / price 0 -- the admin fills those in from the same +/-
 * controls every other game uses, right after creating it. */
export async function addCustomGame(
  name: string,
  options: { forSale: boolean; forRental: boolean }
): Promise<{ error: string | null; game: CustomGame | null }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "El nombre no puede estar vacio", game: null };
  if (!options.forSale && !options.forRental) {
    return { error: "Elegi venta y/o alquiler", game: null };
  }

  const slug = slugify(trimmed);
  if (!slug) return { error: "Nombre invalido", game: null };
  if (staticIds.has(slug) || cache?.some((g) => g.id === slug)) {
    return { error: "Ya existe un juego con ese nombre", game: null };
  }

  const game: CustomGame = {
    id: slug,
    name: trimmed,
    price: 0,
    stock: 0,
    visible: true,
    image: PLACEHOLDER_IMAGE,
    forSale: options.forSale,
    forRental: options.forRental,
  };

  const { error } = await createClient().from("custom_games").insert({
    id: game.id,
    name: game.name,
    price: game.price,
    stock: game.stock,
    visible: game.visible,
    image: game.image,
    for_sale: game.forSale,
    for_rental: game.forRental,
  });
  if (error) return { error: error.message, game: null };

  cache = [...(cache ?? []), game];
  notify();
  return { error: null, game };
}

export async function updateCustomGame(
  id: string,
  patch: Partial<Pick<CustomGame, "price" | "stock" | "visible" | "image" | "forSale" | "forRental">>
): Promise<{ error: string | null }> {
  const { forSale, forRental, ...rest } = patch;
  const dbPatch: Record<string, unknown> = { ...rest };
  if (forSale !== undefined) dbPatch.for_sale = forSale;
  if (forRental !== undefined) dbPatch.for_rental = forRental;

  const { error } = await createClient()
    .from("custom_games")
    .update(dbPatch)
    .eq("id", id);
  if (error) return { error: error.message };

  if (cache) {
    cache = cache.map((g) => (g.id === id ? { ...g, ...patch } : g));
    notify();
  }
  return { error: null };
}

export async function deleteCustomGame(id: string): Promise<{ error: string | null }> {
  const { error } = await createClient().from("custom_games").delete().eq("id", id);
  if (error) return { error: error.message };

  if (cache) {
    cache = cache.filter((g) => g.id !== id);
    notify();
  }
  return { error: null };
}
