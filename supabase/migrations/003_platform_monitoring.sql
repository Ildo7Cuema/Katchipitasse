-- Plataforma: assinaturas da app + regras do sistema (super_admin)

create table if not exists public.app_subscriptions (
  id uuid primary key default gen_random_uuid(),
  plan_name text not null default 'Standard',
  status text not null default 'trial'
    check (status in ('trial', 'active', 'suspended', 'cancelled', 'expired')),
  starts_at date not null default current_date,
  ends_at date,
  annual_fee numeric(12, 2) not null default 0 check (annual_fee >= 0),
  billing_cycle text not null default 'annual' check (billing_cycle = 'annual'),
  is_blocked boolean not null default false,
  block_reason text,
  blocked_at timestamptz,
  max_admins int not null default 3 check (max_admins > 0),
  max_rooms int not null default 20 check (max_rooms > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger app_subscriptions_updated_at
  before update on public.app_subscriptions
  for each row execute function public.set_updated_at();

create table if not exists public.system_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  title text not null,
  description text,
  value_text text,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger system_rules_updated_at
  before update on public.system_rules
  for each row execute function public.set_updated_at();

alter table public.app_subscriptions enable row level security;
alter table public.system_rules enable row level security;

drop policy if exists "subscriptions_admin_read" on public.app_subscriptions;
create policy "subscriptions_admin_read"
  on public.app_subscriptions for select
  using (public.is_admin());

drop policy if exists "subscriptions_super_write" on public.app_subscriptions;
create policy "subscriptions_super_write"
  on public.app_subscriptions for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "rules_admin_read" on public.system_rules;
create policy "rules_admin_read"
  on public.system_rules for select
  using (public.is_admin());

drop policy if exists "rules_super_write" on public.system_rules;
create policy "rules_super_write"
  on public.system_rules for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Seed inicial (idempotente)
insert into public.app_subscriptions (plan_name, status, starts_at, ends_at, annual_fee, billing_cycle, max_admins, max_rooms, notes)
select
  'Anual',
  'active',
  current_date,
  current_date + interval '1 year',
  0,
  'annual',
  3,
  20,
  'Assinatura anual inicial da Katchipitasse Elavoko'
where not exists (select 1 from public.app_subscriptions);

insert into public.system_rules (rule_key, title, description, value_text)
values
  (
    'reserva_confirmacao_obrigatoria',
    'Confirmação administrativa de reservas',
    'Reservas só ficam confirmadas após validação do dono da loja.',
    'true'
  ),
  (
    'pedido_sem_pagamento_online',
    'Pedidos sem pagamento electrónico',
    'Pagamentos são tratados directamente com a empresa.',
    'true'
  ),
  (
    'antecedencia_minima_reserva_horas',
    'Antecedência mínima para reserva (horas)',
    'Número mínimo de horas antes do check-in para aceitar pedidos de reserva.',
    '24'
  ),
  (
    'cancelamento_cliente_permitido',
    'Cliente pode cancelar pedidos/reservas',
    'Se activo, o cliente pode solicitar cancelamento enquanto estiver pendente.',
    'false'
  )
on conflict (rule_key) do nothing;
