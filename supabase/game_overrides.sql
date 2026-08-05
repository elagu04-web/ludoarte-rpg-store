-- Tabla de "inventario": lo que el panel admin puede editar sin tocar
-- codigo -- por ahora, stock y si el juego se muestra o no en la
-- tienda. El resto de la ficha (nombre, precio, descripcion, imagen)
-- sigue viviendo en el codigo (src/data/shelves.ts y rentals.ts); esta
-- tabla solo *sobreescribe* esos dos campos por id de juego.
-- Pegar y ejecutar esto en Supabase: Dashboard -> SQL Editor -> New query -> Run.

create table if not exists public.game_overrides (
  id text primary key,
  -- null = no aplica (juegos que solo se alquilan no tienen stock de venta).
  stock integer,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

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
  ('akropolis', null, true),
  ('avalon', null, true),
  ('aventureros-al-tren', null, true),
  ('bohnanza', null, true),
  ('brass-lancashire', null, true),
  ('camarero', null, true),
  ('can-t-stop', null, true),
  ('codigo-secreto', null, true),
  ('concordia', null, true),
  ('coral', null, true),
  ('detectives-paranormales', null, true),
  ('dragones-del-mar', null, true),
  ('el-arbol-de-aves', null, true),
  ('el-grande', null, true),
  ('escape', null, true),
  ('el-senor-de-los-anillos-el-destino-de-la-comunidad', null, true),
  ('heat', null, true),
  ('kingdomino', null, true),
  ('las-torres-errantes', null, true),
  ('listo-imprenta', null, true),
  ('mi-city', null, true),
  ('numeros-drop', null, true),
  ('oceanos-de-papel', null, true),
  ('paper-dungeons', null, true),
  ('pax-viking', null, true),
  ('piko-piko', null, true),
  ('proyecto-arrecife', null, true),
  ('ra', null, true),
  ('rhino-hero-super-battle', null, true),
  ('senor-de-los-anillos-duelo', null, true),
  ('senor-de-los-anillos-la-comunidad-del-anillo', null, true),
  ('sequence', null, true),
  ('shiki', null, true),
  ('splendor', null, true),
  ('super-fantasy-brawl', null, true),
  ('sushi-go-party', null, true),
  ('t-e-g', null, true),
  ('terra-nova', null, true),
  ('trio', null, true),
  ('valdes', null, true),
  ('zero', null, true)
on conflict (id) do nothing;
