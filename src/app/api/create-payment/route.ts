import { createClient } from "@supabase/supabase-js";
import { allGames } from "@/data/allGames";

// Crea una preferencia de pago de Mercado Pago (Checkout Pro) a partir del
// carrito y devuelve la URL a la que hay que mandar al cliente para pagar.
//
// MERCADOPAGO_ACCESS_TOKEN es un secreto de servidor (nunca NEXT_PUBLIC_*),
// configurado en Vercel -> Settings -> Environment Variables.
//
// Seguridad: el cliente manda id/nombre/precio/cantidad, pero el PRECIO no
// se usa tal cual -- se valida contra el precio real (catalogo del codigo +
// game_overrides + custom_games) antes de crear la preferencia, para que
// nadie pueda pagar de menos manipulando el pedido en el navegador. El id
// no distingue "es venta, alquiler o segunda mano" (el carrito no guarda
// esa distincion), asi que se acepta el precio si coincide con CUALQUIERA
// de los precios validos vigentes para ese juego.

interface CartItemPayload {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

function isValidItem(item: unknown): item is CartItemPayload {
  if (!item || typeof item !== "object") return false;
  const { id, name, price, quantity } = item as Record<string, unknown>;
  return (
    typeof id === "string" &&
    id.length > 0 &&
    typeof name === "string" &&
    name.trim().length > 0 &&
    typeof price === "number" &&
    price > 0 &&
    typeof quantity === "number" &&
    Number.isInteger(quantity) &&
    quantity > 0
  );
}

interface OverrideRow {
  id: string;
  price: number | null;
  rental_price: number | null;
  used_price: number | null;
}

interface CustomRow {
  id: string;
  price: number;
  rental_price: number;
  used_price: number;
  visible: boolean;
}

/** Todos los precios legitimos vigentes para cada id -- de venta, de
 * alquiler y de segunda mano, los que apliquen. Un juego agregado a mano
 * que este oculto (visible=false) no tiene ningun precio valido: no se
 * deberia poder pagar algo que el admin saco de circulacion. */
async function loadValidPrices(ids: string[]): Promise<Map<string, Set<number>>> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [{ data: overrideRows }, { data: customRows }] = await Promise.all([
    supabase
      .from("game_overrides")
      .select("id, price, rental_price, used_price")
      .in("id", ids),
    supabase
      .from("custom_games")
      .select("id, price, rental_price, used_price, visible")
      .in("id", ids),
  ]);

  const overridesById = new Map(
    ((overrideRows as OverrideRow[] | null) ?? []).map((row) => [row.id, row])
  );
  const customById = new Map(
    ((customRows as CustomRow[] | null) ?? []).map((row) => [row.id, row])
  );

  const result = new Map<string, Set<number>>();
  for (const id of ids) {
    const prices = new Set<number>();

    const catalogGame = allGames.find((g) => g.id === id);
    if (catalogGame) {
      const override = overridesById.get(id);
      const salePrice = override?.price ?? catalogGame.basePrice;
      const rentalPrice = override?.rental_price ?? catalogGame.baseRentalPrice;
      const usedPrice = override?.used_price ?? null;
      if (salePrice != null) prices.add(salePrice);
      if (rentalPrice != null) prices.add(rentalPrice);
      if (usedPrice != null) prices.add(usedPrice);
    }

    const custom = customById.get(id);
    if (custom && custom.visible) {
      prices.add(custom.price);
      prices.add(custom.rental_price);
      prices.add(custom.used_price);
    }

    result.set(id, prices);
  }

  return result;
}

export async function POST(request: Request) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return Response.json(
      { error: "MERCADOPAGO_ACCESS_TOKEN no configurado" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Cuerpo invalido" }, { status: 400 });
  }

  const items = (body as { items?: unknown })?.items;
  if (!Array.isArray(items) || items.length === 0 || !items.every(isValidItem)) {
    return Response.json({ error: "Carrito invalido" }, { status: 400 });
  }
  const cartItems = items as CartItemPayload[];

  const validPricesById = await loadValidPrices(cartItems.map((item) => item.id));
  for (const item of cartItems) {
    const validPrices = validPricesById.get(item.id);
    if (!validPrices || !validPrices.has(item.price)) {
      return Response.json(
        { error: `Precio invalido para ${item.name}` },
        { status: 400 }
      );
    }
  }

  const origin = new URL(request.url).origin;
  const isPublicHttps = origin.startsWith("https://");

  const preference: Record<string, unknown> = {
    items: cartItems.map((item) => ({
      title: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: "UYU",
    })),
    back_urls: {
      success: `${origin}/?pago=exitoso`,
      failure: `${origin}/?pago=fallido`,
      pending: `${origin}/?pago=pendiente`,
    },
  };
  // auto_return exige una URL https publica -- en localhost Mercado Pago
  // la rechaza, asi que solo se manda en produccion.
  if (isPublicHttps) {
    preference.auto_return = "approved";
    // Igual que auto_return, Mercado Pago no acepta localhost aca -- en
    // dev el pedido simplemente no queda registrado en Pedidos.
    preference.notification_url = `${origin}/api/mercadopago-webhook`;
  }

  const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preference),
  });

  if (!mpRes.ok) {
    const detail = await mpRes.text();
    return Response.json({ error: `Mercado Pago: ${detail}` }, { status: 502 });
  }

  const data = await mpRes.json();
  const initPoint = isPublicHttps ? data.init_point : data.sandbox_init_point;
  if (typeof initPoint !== "string") {
    return Response.json(
      { error: "Mercado Pago no devolvio una URL de pago" },
      { status: 502 }
    );
  }

  return Response.json({ initPoint });
}
