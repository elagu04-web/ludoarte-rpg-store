-- Crea la tabla de perfiles de jugador, uno por usuario logueado.
-- Pegar y ejecutar esto en Supabase: Dashboard -> SQL Editor -> New query -> Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  character_tint integer,
  monsters_defeated integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or auth.jwt() ->> 'email' = 'elagu04@gmail.com');

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Crea automaticamente una fila en "profiles" cada vez que alguien
-- se registra (via Google) en auth.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Migracion: si la tabla "profiles" ya existia de antes (sin la
-- columna character_tint), correr esto para agregarla.
alter table public.profiles add column if not exists character_tint integer;

-- Migracion: agrega el contador de monstruos (cajas) vencidos.
alter table public.profiles add column if not exists monsters_defeated integer not null default 0;

-- Suma 1 al contador del usuario logueado. Usa security definer para
-- poder sumar de forma atomica (sin leer y despues escribir, que podria
-- perder conteos si matas varios monstruos muy rapido); usa auth.uid()
-- adentro en vez de recibir el id como parametro, para que nadie pueda
-- sumarle victorias al perfil de otra persona.
create or replace function public.increment_monsters_defeated()
returns void
language sql
security definer set search_path = public
as $$
  update public.profiles
  set monsters_defeated = monsters_defeated + 1
  where id = auth.uid();
$$;

-- Migracion: deja que la cuenta elagu04@gmail.com vea todos los
-- perfiles (antes de esto, cada quien solo podia ver el propio).
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or auth.jwt() ->> 'email' = 'elagu04@gmail.com');

-- Migracion: cuentas que iniciaron sesion antes de que existiera la
-- tabla "profiles" (o el trigger) nunca recibieron su fila -- el
-- trigger solo se dispara en un registro nuevo, no en logins
-- posteriores. Crea la fila que falte para cualquier cuenta ya
-- existente en auth.users.
insert into public.profiles (id, email)
select id, email from auth.users
where id not in (select id from public.profiles);

-- Version mas robusta: crea la fila del jugador si todavia no
-- existe (en vez de asumir que el trigger ya la creo), y despues
-- suma 1. Reemplaza a la version anterior de esta misma funcion.
create or replace function public.increment_monsters_defeated()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, monsters_defeated)
  values (auth.uid(), (select email from auth.users where id = auth.uid()), 1)
  on conflict (id) do update
    set monsters_defeated = public.profiles.monsters_defeated + 1;
end;
$$;
