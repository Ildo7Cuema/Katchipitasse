-- Katchiitassi Elavoko — initial schema + RLS
-- Run in Supabase SQL Editor or via CLI

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  role text not null default 'cliente' check (role in ('cliente', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Categories & dishes
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  description text,
  price numeric(12, 2) not null check (price >= 0),
  image_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dishes_category_idx on public.dishes (category_id);
create index dishes_active_featured_idx on public.dishes (is_active, is_featured);

-- ---------------------------------------------------------------------------
-- Rooms
-- ---------------------------------------------------------------------------
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  features text,
  price_per_night numeric(12, 2) not null check (price_per_night >= 0),
  max_guests int not null check (max_guests > 0),
  image_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  notes text,
  status text not null default 'pendente'
    check (status in ('pendente', 'confirmado', 'em_preparacao', 'concluido', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  dish_id uuid references public.dishes (id) on delete set null,
  dish_name text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Reservations
-- ---------------------------------------------------------------------------
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete restrict,
  customer_name text not null,
  customer_phone text not null,
  guests int not null check (guests > 0),
  check_in date not null,
  check_out date not null,
  notes text,
  status text not null default 'pendente'
    check (status in ('pendente', 'confirmada', 'ocupada', 'concluida', 'cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservations_dates_check check (check_out > check_in)
);

create index reservations_room_dates_idx on public.reservations (room_id, check_in, check_out);
create index reservations_user_idx on public.reservations (user_id);
create index reservations_status_idx on public.reservations (status);

-- ---------------------------------------------------------------------------
-- Company settings (singleton)
-- ---------------------------------------------------------------------------
create table public.company_settings (
  id int primary key default 1 check (id = 1),
  company_name text not null default 'Katchiitassi Elavoko',
  tagline text default 'Restaurante & Hospedaria',
  description text,
  logo_url text,
  phone text,
  whatsapp text,
  email text,
  address text,
  maps_url text,
  opening_hours text,
  facebook_url text,
  instagram_url text,
  privacy_policy_url text,
  updated_at timestamptz not null default now()
);

insert into public.company_settings (id, company_name, tagline, description, logo_url, phone, whatsapp, email, address, maps_url, opening_hours)
values (
  1,
  'Katchipitasse Elavoko',
  'Restaurante & Hospedaria',
  'Hospitalidade autêntica, refeições saborosas e quartos acolhedores. Bem-vindo à Katchipitasse Elavoko.',
  '/logo.png',
  '+244 900 000 000',
  '+244900000000',
  'contacto@katchipitasse.ao',
  'Luanda, Angola',
  'https://maps.google.com',
  'Restaurante: 07:00–22:00 | Recepção: 24h'
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger categories_updated_at before update on public.categories
for each row execute function public.set_updated_at();
create trigger dishes_updated_at before update on public.dishes
for each row execute function public.set_updated_at();
create trigger rooms_updated_at before update on public.rooms
for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();
create trigger reservations_updated_at before update on public.reservations
for each row execute function public.set_updated_at();
create trigger company_settings_updated_at before update on public.company_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    new.email,
    'cliente'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Room availability: reject overlapping non-cancelled reservations
create or replace function public.assert_room_available()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'cancelada' then
    return new;
  end if;

  if exists (
    select 1
    from public.reservations r
    where r.room_id = new.room_id
      and r.id is distinct from new.id
      and r.status <> 'cancelada'
      and new.check_in < r.check_out
      and new.check_out > r.check_in
  ) then
    raise exception 'Quarto indisponível para o período seleccionado';
  end if;

  return new;
end;
$$;

create trigger reservations_availability
  before insert or update of room_id, check_in, check_out, status
  on public.reservations
  for each row execute function public.assert_room_available();

create or replace function public.check_room_availability(
  p_room_id uuid,
  p_check_in date,
  p_check_out date,
  p_exclude_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.reservations r
    where r.room_id = p_room_id
      and (p_exclude_id is null or r.id <> p_exclude_id)
      and r.status <> 'cancelada'
      and p_check_in < r.check_out
      and p_check_out > r.check_in
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.dishes enable row level security;
alter table public.rooms enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reservations enable row level security;
alter table public.company_settings enable row level security;

-- Profiles
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

create policy "profiles_admin_update"
  on public.profiles for update
  using (public.is_admin());

-- Categories / dishes / rooms — public read active; admin write
create policy "categories_public_read"
  on public.categories for select
  using (is_active = true or public.is_admin());

create policy "categories_admin_all"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "dishes_public_read"
  on public.dishes for select
  using (is_active = true or public.is_admin());

create policy "dishes_admin_all"
  on public.dishes for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "rooms_public_read"
  on public.rooms for select
  using (is_active = true or public.is_admin());

create policy "rooms_admin_all"
  on public.rooms for all
  using (public.is_admin())
  with check (public.is_admin());

-- Orders
create policy "orders_select_own_or_admin"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

create policy "orders_insert_own"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "orders_update_admin"
  on public.orders for update
  using (public.is_admin());

create policy "order_items_select"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "order_items_insert_own"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy "order_items_admin_all"
  on public.order_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- Reservations
create policy "reservations_select_own_or_admin"
  on public.reservations for select
  using (auth.uid() = user_id or public.is_admin());

create policy "reservations_insert_own"
  on public.reservations for insert
  with check (auth.uid() = user_id and status = 'pendente');

create policy "reservations_update_admin"
  on public.reservations for update
  using (public.is_admin());

-- Company settings
create policy "company_settings_public_read"
  on public.company_settings for select
  using (true);

create policy "company_settings_admin_update"
  on public.company_settings for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage buckets (run after creating buckets in dashboard if needed)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('dishes', 'dishes', true), ('rooms', 'rooms', true), ('branding', 'branding', true)
on conflict (id) do nothing;

create policy "public_read_images"
  on storage.objects for select
  using (bucket_id in ('dishes', 'rooms', 'branding'));

create policy "admin_upload_images"
  on storage.objects for insert
  with check (bucket_id in ('dishes', 'rooms', 'branding') and public.is_admin());

create policy "admin_update_images"
  on storage.objects for update
  using (bucket_id in ('dishes', 'rooms', 'branding') and public.is_admin());

create policy "admin_delete_images"
  on storage.objects for delete
  using (bucket_id in ('dishes', 'rooms', 'branding') and public.is_admin());
