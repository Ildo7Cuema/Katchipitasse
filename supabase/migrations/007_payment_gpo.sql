-- GPO de pagamentos configurável por utilizador
-- platform → Super Admin (comprovativos da assinatura anual)
-- store    → Admin da loja (receber pagamentos dos clientes)

create table if not exists public.payment_gpo (
  scope text primary key check (scope in ('platform', 'store')),
  enabled boolean not null default false,
  proof_phone text,
  proof_whatsapp text,
  account_name text,
  bank_name text,
  iban text,
  multicaixa_entity text,
  multicaixa_reference text,
  methods jsonb not null default '["transferencia","multicaixa","cash"]'::jsonb,
  instructions text,
  updated_at timestamptz not null default now()
);

create trigger payment_gpo_updated_at
  before update on public.payment_gpo
  for each row execute function public.set_updated_at();

alter table public.payment_gpo enable row level security;

-- Loja: pública (clientes precisam de ver como pagar)
-- Plataforma: apenas admin/super (loja precisa de saber para onde enviar comprovativo)
drop policy if exists "payment_gpo_select" on public.payment_gpo;
create policy "payment_gpo_select"
  on public.payment_gpo for select
  using (scope = 'store' or public.is_admin());

drop policy if exists "payment_gpo_write" on public.payment_gpo;
create policy "payment_gpo_write"
  on public.payment_gpo for all
  using (
    (scope = 'platform' and public.is_super_admin())
    or (scope = 'store' and public.is_admin())
  )
  with check (
    (scope = 'platform' and public.is_super_admin())
    or (scope = 'store' and public.is_admin())
  );

insert into public.payment_gpo (
  scope,
  enabled,
  proof_phone,
  proof_whatsapp,
  methods,
  instructions
)
values
  (
    'platform',
    true,
    '921923232',
    '244921923232',
    '["transferencia","multicaixa","cash"]'::jsonb,
    'Envie o comprovativo da assinatura anual para este WhatsApp. Após validação, a aplicação é reactivada automaticamente com um novo ciclo de 12 meses.'
  ),
  (
    'store',
    false,
    null,
    null,
    '["transferencia","multicaixa","cash"]'::jsonb,
    'Após confirmar o pedido ou a reserva, envie o comprovativo para o WhatsApp indicado.'
  )
on conflict (scope) do nothing;
