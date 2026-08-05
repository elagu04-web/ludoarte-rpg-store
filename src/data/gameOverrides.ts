import { createClient } from "@/lib/supabase/client";

export interface GameOverride {
  stock: number | null;
  visible: boolean;
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
    .select("id, stock, visible");

  const map: GameOverrides = new Map();
  for (const row of data ?? []) {
    map.set(row.id, { stock: row.stock, visible: row.visible });
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

/** Admin-only: called from the inventory screen. RLS on the table
 * rejects this for anyone but elagu04@gmail.com regardless. */
export async function updateGameOverride(
  id: string,
  patch: Partial<GameOverride>
): Promise<{ error: string | null }> {
  const current = cache?.get(id) ?? { stock: null, visible: true };
  const next = { ...current, ...patch };

  const { error } = await createClient()
    .from("game_overrides")
    .upsert({ id, stock: next.stock, visible: next.visible });

  if (error) return { error: error.message };

  if (cache) {
    cache.set(id, next);
    subscribers.forEach((cb) => cb(cache!));
  }
  return { error: null };
}
