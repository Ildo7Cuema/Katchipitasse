-- Credenciais de Gateway de Pagamento online (recebidas do banco)
-- platform → exclusivo Super Admin (pagamento da assinatura da app)
-- store    → exclusivo Admin da loja (pagamento dos clientes)
-- Segredos NUNCA são expostos publicamente (RPC segura).

alter table public.payment_gpo
  add column if not exists gateway_enabled boolean not null default false;

alter table public.payment_gpo
  add column if not exists gateway_provider text;

alter table public.payment_gpo
  drop constraint if exists payment_gpo_gateway_provider_check;

alter table public.payment_gpo
  add constraint payment_gpo_gateway_provider_check
  check (
    gateway_provider is null
    or gateway_provider in ('emis_gpo', 'proxypay', 'appypay', 'multicaixa_express', 'paypay', 'custom')
  );

alter table public.payment_gpo
  add column if not exists gateway_environment text not null default 'sandbox';

alter table public.payment_gpo
  drop constraint if exists payment_gpo_gateway_environment_check;

alter table public.payment_gpo
  add constraint payment_gpo_gateway_environment_check
  check (gateway_environment in ('sandbox', 'production'));

alter table public.payment_gpo
  add column if not exists gateway_merchant_id text;

alter table public.payment_gpo
  add column if not exists gateway_terminal_id text;

alter table public.payment_gpo
  add column if not exists gateway_entity_id text;

alter table public.payment_gpo
  add column if not exists gateway_api_key text;

alter table public.payment_gpo
  add column if not exists gateway_api_secret text;

alter table public.payment_gpo
  add column if not exists gateway_webhook_secret text;

alter table public.payment_gpo
  add column if not exists gateway_base_url text;

alter table public.payment_gpo
  add column if not exists gateway_callback_url text;

alter table public.payment_gpo
  add column if not exists gateway_notes text;

-- Leitura completa (com segredos) só pelo dono do âmbito
drop policy if exists "payment_gpo_select" on public.payment_gpo;
create policy "payment_gpo_select"
  on public.payment_gpo for select
  using (
    (scope = 'platform' and public.is_super_admin())
    or (scope = 'store' and public.is_admin())
  );

-- Escrita mantém-se exclusiva por âmbito
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

-- Leitura segura sem segredos:
-- - store: público (clientes)
-- - platform: admin da loja / super (para página de assinatura)
create or replace function public.get_payment_gpo_safe(p_scope text)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  row_rec public.payment_gpo%rowtype;
  methods_json json;
begin
  if p_scope not in ('platform', 'store') then
    raise exception 'Âmbito inválido';
  end if;

  if p_scope = 'platform' and not public.is_admin() then
    raise exception 'Sem permissão para ler GPO da plataforma';
  end if;

  select * into row_rec
  from public.payment_gpo
  where scope = p_scope;

  if not found then
    return json_build_object(
      'scope', p_scope,
      'enabled', false,
      'gateway_enabled', false,
      'gateway_configured', false
    );
  end if;

  methods_json := coalesce(row_rec.methods, '[]'::jsonb)::json;

  return json_build_object(
    'scope', row_rec.scope,
    'enabled', row_rec.enabled,
    'proof_phone', row_rec.proof_phone,
    'proof_whatsapp', row_rec.proof_whatsapp,
    'account_name', row_rec.account_name,
    'bank_name', row_rec.bank_name,
    'iban', row_rec.iban,
    'multicaixa_entity', row_rec.multicaixa_entity,
    'multicaixa_reference', row_rec.multicaixa_reference,
    'methods', methods_json,
    'instructions', row_rec.instructions,
    'gateway_enabled', row_rec.gateway_enabled,
    'gateway_provider', row_rec.gateway_provider,
    'gateway_environment', row_rec.gateway_environment,
    'gateway_merchant_id', case when row_rec.gateway_enabled then row_rec.gateway_merchant_id else null end,
    'gateway_terminal_id', case when row_rec.gateway_enabled then row_rec.gateway_terminal_id else null end,
    'gateway_entity_id', case when row_rec.gateway_enabled then row_rec.gateway_entity_id else null end,
    'gateway_base_url', null,
    'gateway_callback_url', null,
    'gateway_api_key', null,
    'gateway_api_secret', null,
    'gateway_webhook_secret', null,
    'gateway_notes', null,
    'gateway_configured', (
      row_rec.gateway_enabled
      and nullif(trim(coalesce(row_rec.gateway_api_key, '')), '') is not null
      and nullif(trim(coalesce(row_rec.gateway_merchant_id, row_rec.gateway_entity_id, '')), '') is not null
    )
  );
end;
$$;

revoke all on function public.get_payment_gpo_safe(text) from public;
grant execute on function public.get_payment_gpo_safe(text) to anon, authenticated;
