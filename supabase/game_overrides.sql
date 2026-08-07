-- Tabla de "inventario": lo que el panel admin puede editar sin tocar
-- codigo -- por ahora, stock y si el juego se muestra o no en la
-- tienda. El resto de la ficha (nombre, precio, descripcion, imagen)
-- sigue viviendo en el codigo (src/data/shelves.ts y rentals.ts); esta
-- tabla solo *sobreescribe* esos dos campos por id de juego.
-- Pegar y ejecutar esto en Supabase: Dashboard -> SQL Editor -> New query -> Run.

create table if not exists public.game_overrides (
  id text primary key,
  stock integer,
  visible boolean not null default true,
  -- null = usar el precio del codigo (shelves.ts / rentals.ts). Los
  -- juegos que solo se alquilan no tienen precio de venta en el codigo,
  -- asi que para venderlos hace falta cargar uno aca.
  price integer,
  -- null = usar el precio de alquiler del codigo (rentals.ts).
  rental_price integer,
  -- null = usar lo que dice el codigo (segun en que archivo esta el
  -- juego, shelves.ts y/o rentals.ts). El panel de inventario deja
  -- cambiar esto para cualquier juego, aunque por ahora solo lo usa
  -- como informacion (no cambia que se ve en Tienda/Alquiler).
  for_sale boolean,
  for_rental boolean,
  -- null = no es de segunda mano. Mismo stock que la version nueva --
  -- ver la nota igual en custom_games.sql.
  second_hand boolean,
  -- null = todavia no se cargo un precio de segunda mano.
  used_price integer,
  updated_at timestamptz not null default now()
);

-- Si la tabla ya existia de una corrida anterior de este script, esto la
-- pone al dia sin pisar nada: agrega las columnas nuevas si todavia no
-- estan, y pasa de "stock null" (no aplica) a "stock 0" (aplica, todavia
-- no hay unidades) en los juegos que solo se alquilan -- asi el panel de
-- inventario ya deja subirles el stock si se compra uno para vender.
alter table public.game_overrides add column if not exists price integer;
alter table public.game_overrides add column if not exists rental_price integer;
alter table public.game_overrides add column if not exists for_sale boolean;
alter table public.game_overrides add column if not exists for_rental boolean;
alter table public.game_overrides add column if not exists second_hand boolean;
alter table public.game_overrides add column if not exists used_price integer;
update public.game_overrides set stock = 0 where stock is null;

alter table public.game_overrides enable row level security;

-- Cualquiera (incluido un visitante sin sesion) necesita poder leer esto
-- para saber que mostrar en la tienda.
drop policy if exists "Anyone can view game overrides" on public.game_overrides;
create policy "Anyone can view game overrides"
  on public.game_overrides for select
  using (true);

drop policy if exists "Admin can insert game overrides" on public.game_overrides;
create policy "Admin can insert game overrides"
  on public.game_overrides for insert
  with check (auth.jwt() ->> 'email' = 'elagu04@gmail.com');

drop policy if exists "Admin can update game overrides" on public.game_overrides;
create policy "Admin can update game overrides"
  on public.game_overrides for update
  using (auth.jwt() ->> 'email' = 'elagu04@gmail.com');

-- Una fila por cada uno de los 81 juegos del catalogo, con el stock
-- actual (los de venta) tal como esta hoy en el codigo. "on conflict
-- do nothing" para que correr esto de nuevo no pise cambios que ya
-- hiciste desde el panel admin.
insert into public.game_overrides (id, stock, visible) values
  ('papas-queman', 2, true),
  ('salem-1692', 0, true),
  ('llamagedon', 1, true),
  ('no-game-over', 1, true),
  ('yokai-pagoda', 2, true),
  ('exploding-kittens', 1, true),
  ('niji', 1, true),
  ('dados-pato-mar', 1, true),
  ('terraforming-mars', 1, true),
  ('pandemia', 1, true),
  ('katamino', 0, true),
  ('domino-6', 0, true),
  ('faraway', 0, true),
  ('rin-rin-raja', 1, true),
  ('flores', 1, true),
  ('difference', 1, true),
  ('lama', 1, true),
  ('la-noche-de-gansferatu', 1, true),
  ('cubirds', 1, true),
  ('district-noir', 1, true),
  ('palabras-basura', 0, true),
  ('hombres-lobo', 1, true),
  ('secret-hitler', 1, true),
  ('taco-cat-goat-cheese-pizza', 0, true),
  ('polilla-tramposa', 0, true),
  ('saboteur', 0, true),
  ('el-rebano', 0, true),
  ('patachof', 1, true),
  ('vaalbara', 1, true),
  ('tummple', 1, true),
  ('batawaf', 1, true),
  ('barrio', 0, true),
  ('catan', 1, true),
  ('porto', 0, true),
  ('carcassonne', 1, true),
  ('banana-azul', 1, true),
  ('azul', 1, true),
  ('ajedrez', 1, true),
  ('burako', 1, true),
  ('flip-7', 1, true),
  ('akropolis', 0, true),
  ('avalon', 0, true),
  ('aventureros-al-tren', 0, true),
  ('bohnanza', 0, true),
  ('brass-lancashire', 0, true),
  ('camarero', 0, true),
  ('can-t-stop', 0, true),
  ('codigo-secreto', 0, true),
  ('concordia', 0, true),
  ('coral', 0, true),
  ('detectives-paranormales', 0, true),
  ('dragones-del-mar', 0, true),
  ('el-arbol-de-aves', 0, true),
  ('el-grande', 0, true),
  ('escape', 0, true),
  ('el-senor-de-los-anillos-el-destino-de-la-comunidad', 0, true),
  ('heat', 0, true),
  ('kingdomino', 0, true),
  ('las-torres-errantes', 0, true),
  ('listo-imprenta', 0, true),
  ('mi-city', 0, true),
  ('numeros-drop', 0, true),
  ('oceanos-de-papel', 0, true),
  ('paper-dungeons', 0, true),
  ('pax-viking', 0, true),
  ('piko-piko', 0, true),
  ('proyecto-arrecife', 0, true),
  ('ra', 0, true),
  ('rhino-hero-super-battle', 0, true),
  ('senor-de-los-anillos-duelo', 0, true),
  ('senor-de-los-anillos-la-comunidad-del-anillo', 0, true),
  ('sequence', 0, true),
  ('shiki', 0, true),
  ('splendor', 0, true),
  ('super-fantasy-brawl', 0, true),
  ('sushi-go-party', 0, true),
  ('t-e-g', 0, true),
  ('terra-nova', 0, true),
  ('trio', 0, true),
  ('valdes', 0, true),
  ('zero', 0, true)
on conflict (id) do nothing;
