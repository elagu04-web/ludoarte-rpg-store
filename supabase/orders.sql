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

-- El webhook lo llama Mercado Pago directamente (no hay sesion de admin
-- en ese contexto), asi que necesita poder insertar/actualizar con la
-- clave anonima. La validez del pedido la garantiza el propio webhook:
-- antes de guardar nada, vuelve a consultar el pago contra la API de
-- Mercado Pago con el access token secreto, nunca confia en lo que llega
-- directo en la notificacion.
drop policy if exists "Anyone can insert orders" on public.orders;
create policy "Anyone can insert orders"
  on public.orders for insert
  with check (true);

drop policy if exists "Anyone can update orders" on public.orders;
create policy "Anyone can update orders"
  on public.orders for update
  using (true);
