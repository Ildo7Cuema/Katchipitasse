-- Assinatura anual única + bloqueio da app pelo Super Admin

-- Valor anual (substitui mensalidade)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'app_subscriptions'
      and column_name = 'monthly_fee'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'app_subscriptions'
      and column_name = 'annual_fee'
  ) then
    alter table public.app_subscriptions rename column monthly_fee to annual_fee;
  end if;
end $$;

alter table public.app_subscriptions
  add column if not exists annual_fee numeric(12, 2) not null default 0;

alter table public.app_subscriptions
  drop constraint if exists app_subscriptions_monthly_fee_check;

alter table public.app_subscriptions
  drop constraint if exists app_subscriptions_annual_fee_check;

alter table public.app_subscriptions
  add constraint app_subscriptions_annual_fee_check check (annual_fee >= 0);

alter table public.app_subscriptions
  add column if not exists billing_cycle text not null default 'annual';

alter table public.app_subscriptions
  drop constraint if exists app_subscriptions_billing_cycle_check;

alter table public.app_subscriptions
  add constraint app_subscriptions_billing_cycle_check check (billing_cycle = 'annual');

alter table public.app_subscriptions
  add column if not exists is_blocked boolean not null default false;

alter table public.app_subscriptions
  add column if not exists block_reason text;

alter table public.app_subscriptions
  add column if not exists blocked_at timestamptz;

-- Garantir uma única assinatura
delete from public.app_subscriptions a
using public.app_subscriptions b
where a.created_at < b.created_at;

create unique index if not exists app_subscriptions_singleton
  on public.app_subscriptions ((true));

update public.app_subscriptions
set
  billing_cycle = 'annual',
  plan_name = coalesce(nullif(plan_name, ''), 'Anual'),
  ends_at = coalesce(ends_at, starts_at + interval '1 year')
where true;

-- Estado de bloqueio legível por anon/authenticated (sem expor valor)
create or replace function public.get_app_lock_status()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  row_rec public.app_subscriptions%rowtype;
  locked boolean := false;
  reason text := null;
begin
  select * into row_rec
  from public.app_subscriptions
  order by created_at desc
  limit 1;

  if not found then
    return json_build_object(
      'is_blocked', false,
      'block_reason', null,
      'status', null,
      'ends_at', null,
      'plan_name', null,
      'billing_cycle', 'annual'
    );
  end if;

  if row_rec.is_blocked then
    locked := true;
    reason := coalesce(nullif(trim(row_rec.block_reason), ''), 'Aplicação bloqueada pelo administrador da plataforma.');
  elsif row_rec.status in ('suspended', 'cancelled', 'expired') then
    locked := true;
    reason := case row_rec.status
      when 'suspended' then coalesce(nullif(trim(row_rec.block_reason), ''), 'Assinatura suspensa por irregularidade de pagamento ou risco operacional.')
      when 'cancelled' then 'Assinatura cancelada. Contacte o suporte da plataforma.'
      when 'expired' then 'Assinatura anual expirada. Renove para reactivar a aplicação.'
      else 'Aplicação indisponível.'
    end;
  elsif row_rec.ends_at is not null and row_rec.ends_at < current_date and row_rec.status not in ('trial') then
    locked := true;
    reason := 'Assinatura anual expirada. Renove para reactivar a aplicação.';
  end if;

  return json_build_object(
    'is_blocked', locked,
    'block_reason', reason,
    'status', row_rec.status,
    'ends_at', row_rec.ends_at,
    'plan_name', row_rec.plan_name,
    'billing_cycle', row_rec.billing_cycle
  );
end;
$$;

revoke all on function public.get_app_lock_status() from public;
grant execute on function public.get_app_lock_status() to anon, authenticated;
