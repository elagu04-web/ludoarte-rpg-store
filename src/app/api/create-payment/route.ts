// Crea una preferencia de pago de Mercado Pago (Checkout Pro) a partir del
// carrito y devuelve la URL a la que hay que mandar al cliente para pagar.
//
// MERCADOPAGO_ACCESS_TOKEN es un secreto de servidor (nunca NEXT_PUBLIC_*),
// configurado en Vercel -> Settings -> Environment Variables.
//
// Nota de seguridad: esta ruta confia en el precio/nombre que manda el
// cliente (mismo nivel de confianza que ya tenia el flujo de "Comprar por
// WhatsApp", que arma el mensaje del lado del cliente sin ninguna
// validacion) -- no vuelve a calcular el precio contra Supabase. Para una
// tienda de este tamaño, con retiro en persona y sin stock de alto valor,
// es un tradeoff razonable por ahora; si mas adelante hace falta blindarlo
// contra manipulacion del precio en el navegador, hay que recalcularlo aca
// contra game_overrides/custom_games en vez de confiar en el body.

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

  const origin = new URL(request.url).origin;
  const isPublicHttps = origin.startsWith("https://");

  const preference: Record<string, unknown> = {
    items: (items as CartItemPayload[]).map((item) => ({
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
