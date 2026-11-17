-- Imagens editáveis das páginas públicas (Admin da loja)
-- Se NULL / vazio → a app mantém as imagens padrão (logo, carrossel de pratos/quartos, capas)

alter table public.company_settings
  add column if not exists restaurant_cover_url text;

alter table public.company_settings
  add column if not exists lodging_cover_url text;

alter table public.company_settings
  add column if not exists contacts_cover_url text;

-- Até 5 slides do hero: [{ "url": "...", "label": "...", "caption": "..." }, ...]
alter table public.company_settings
  add column if not exists hero_images jsonb not null default '[]'::jsonb;

alter table public.company_settings
  drop constraint if exists company_settings_hero_images_is_array;

alter table public.company_settings
  add constraint company_settings_hero_images_is_array
  check (jsonb_typeof(hero_images) = 'array');
