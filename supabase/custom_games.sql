-- Juegos que el admin agrega desde el panel de Inventario y que NO estan
-- en el catalogo del codigo (src/data/shelves.ts / rentals.ts) -- por
-- ejemplo, uno nuevo que se compro y todavia no se cargo a mano en el
-- codigo. A diferencia de game_overrides (que solo *sobreescribe* un
-- juego que ya existe en el codigo), esta tabla es la ficha completa:
-- nombre, precio, stock, visibilidad e imagen.
-- Pegar y ejecutar esto en Supabase: Dashboard -> SQL Editor -> New query -> Run.

create table if not exists public.custom_games (
  -- El mismo "slug" que usa el resto del catalogo (nombre en minusculas,
  -- sin tildes, espacios reemplazados por guiones), generado en el panel
  -- admin al crear el juego.
  id text primary key,
  name text not null,
  price integer not null default 0,
  rental_price integer not null default 0,
  stock integer not null default 0,
  visible boolean not null default true,
  -- Ruta esperada de la foto real: /assets/boardgames/{id}.png. Arranca
  -- apuntando al dibujo de relleno hasta que se suba la foto de verdad
  -- con ese nombre exacto.
  image text not null,
  for_sale boolean not null default true,
  for_rental boolean not null default false,
  second_hand boolean not null default false,
  used_price integer not null default 0,
  created_at timestamptz not null default now()
);

-- Si la tabla ya existia de una corrida anterior de este script, agrega
-- las columnas nuevas sin pisar nada (todo lo ya cargado queda como
-- "solo venta", que era el unico comportamiento posible hasta ahora).
alter table public.custom_games add column if not exists for_sale boolean not null default true;
alter table public.custom_games add column if not exists for_rental boolean not null default false;
alter table public.custom_games add column if not exists rental_price integer not null default 0;
alter table public.custom_games add column if not exists second_hand boolean not null default false;
alter table public.custom_games add column if not exists used_price integer not null default 0;

alter table public.custom_games enable row level security;

drop policy if exists "Anyone can view custom games" on public.custom_games;
create policy "Anyone can view custom games"
  on public.custom_games for select
  using (true);

drop policy if exists "Admin can insert custom games" on public.custom_games;
create policy "Admin can insert custom games"
  on public.custom_games for insert
  with check (auth.jwt() ->> 'email' = 'elagu04@gmail.com');

drop policy if exists "Admin can update custom games" on public.custom_games;
create policy "Admin can update custom games"
  on public.custom_games for update
  using (auth.jwt() ->> 'email' = 'elagu04@gmail.com');

drop policy if exists "Admin can delete custom games" on public.custom_games;
create policy "Admin can delete custom games"
  on public.custom_games for delete
  using (auth.jwt() ->> 'email' = 'elagu04@gmail.com');
