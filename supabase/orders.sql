-- Registro de pedidos pagados por Mercado Pago -- lo llena el webhook de
-- pagos (api/mercadopago-webhook) apenas Mercado Pago aprueba un pago,
-- asi el admin puede ver que se vendio desde el menu "Pedidos" sin tener
-- que entrar a la app de Mercado Pago.
-- Pegar y ejecutar esto en Supabase: Dashboard -> SQL Editor -> New query -> Run.

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  mp_payment_id text not null unique,
  status text not null,
  -- Array de {name, quantity, price}, tal cual se armo el carrito.
  items jsonb not null,
  total integer not null,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "Admin can view orders" on public.orders;
create policy "Admin can view orders"
  on public.orders for select
  using (auth.jwt() ->> 'email' = 'elagu04@gmail.com');

-- Sin policy de insert/update para nadie (ni admin, ni "anyone"): con RLS
-- activado y ninguna policy que lo permita, esa operacion queda bloqueada
-- para cualquiera que use la clave anonima -- incluido un visitante que
-- intente escribir un pedido falso directo contra Supabase, sin pasar
-- para nada por Mercado Pago.
--
-- El webhook (api/mercadopago-webhook) es el UNICO que puede escribir
-- aca, usando SUPABASE_SERVICE_ROLE_KEY (un secreto de servidor que
-- bypasea RLS por completo) en vez de la clave anonima -- por eso no le
-- hace falta ninguna policy propia. La validez del pedido la sigue
-- garantizando el webhook: antes de guardar nada, vuelve a consultar el
-- pago contra la API de Mercado Pago con el access token secreto, nunca
-- confia en lo que llega directo en la notificacion.
--
-- ANTES esta tabla tenia policies "with check (true)" que dejaban
-- insertar/actualizar a cualquiera con la clave anonima (publica) del
-- sitio -- alguien podia escribir pedidos falsos sin pasar por Mercado
-- Pago. Si ya corriste una version vieja de este archivo, corre esto para
-- sacarlas:
drop policy if exists "Anyone can insert orders" on public.orders;
drop policy if exists "Anyone can update orders" on public.orders;
