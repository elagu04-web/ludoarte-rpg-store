import { createClient } from "@supabase/supabase-js";

// Mercado Pago llama esta URL (configurada como notification_url al crear
// la preferencia en api/create-payment) cada vez que un pago cambia de
// estado. Nunca confiamos en el contenido de la notificacion en si -- solo
// trae un id -- volvemos a pedirle el pago real a la API de Mercado Pago
// con el access token secreto antes de guardar nada.
//
// Escribe en "orders" con SUPABASE_SERVICE_ROLE_KEY (secreto de servidor,
// nunca NEXT_PUBLIC_*, nunca pegado en el chat) en vez de la clave anonima
// -- la tabla no tiene NINGUNA policy de insert/update para "anyone", asi
// que con la clave anonima nadie (ni siquiera este propio webhook) podria
// escribir ahi. La service role key bypasea RLS por completo, que es
// exactamente lo que hace falta para esta unica escritura de confianza
// del lado del servidor.

interface MpItem {
  title?: string;
  quantity?: number | string;
  unit_price?: number | string;
}

function extractPaymentId(body: unknown, url: string): string | null {
  // Formato nuevo: POST { type: "payment", data: { id: "123" } }
  const asRecord = body as Record<string, unknown> | null;
  const dataId = (asRecord?.data as Record<string, unknown> | undefined)?.id;
  if (asRecord?.type === "payment" && typeof dataId === "string") return dataId;
  if (asRecord?.type === "payment" && typeof dataId === "number") return String(dataId);

  // Formato viejo (IPN): ?topic=payment&id=123 en la URL.
  const params = new URL(url).searchParams;
  if (params.get("topic") === "payment" && params.get("id")) {
    return params.get("id");
  }

  return null;
}

export async function POST(request: Request) {
  // Siempre 200 salvo que falte configuracion nuestra -- si devolvemos un
  // error por una notificacion que no nos interesa, Mercado Pago la
  // reintenta sin parar.
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return Response.json({ error: "MERCADOPAGO_ACCESS_TOKEN no configurado" }, { status: 500 });
  }
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY no configurado" }, { status: 500 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    // Algunas notificaciones vienen sin body (solo query params) -- seguir.
  }

  const paymentId = extractPaymentId(body, request.url);
  if (!paymentId) return Response.json({ ok: true });

  const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!paymentRes.ok) return Response.json({ ok: true });
  const payment = await paymentRes.json();

  if (payment.status !== "approved") return Response.json({ ok: true });

  const rawItems: MpItem[] = payment.additional_info?.items ?? [];
  const items = rawItems.map((item) => ({
    name: item.title ?? "Juego",
    quantity: Number(item.quantity) || 1,
    price: Number(item.unit_price) || 0,
  }));
  const total =
    items.length > 0
      ? items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      : Math.round(Number(payment.transaction_amount) || 0);

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
  const { error } = await supabase.from("orders").upsert(
    {
      mp_payment_id: String(paymentId),
      status: payment.status,
      items,
      total,
    },
    { onConflict: "mp_payment_id" }
  );
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
