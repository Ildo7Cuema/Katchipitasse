-- Pedido de pagamento/renovação da assinatura pelo admin da loja

alter table public.app_subscriptions
  add column if not exists payment_requested_at timestamptz;

alter table public.app_subscriptions
  add column if not exists payment_requested_by uuid references public.profiles (id) on delete set null;

alter table public.app_subscriptions
  add column if not exists payment_note text;

alter table public.app_subscriptions
  add column if not exists payment_method text;

-- Admin da loja pode solicitar renovação após pagar (não altera valor/estado final)
create or replace function public.request_subscription_payment(p_note text default null, p_method text default null)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  row_rec public.app_subscriptions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária';
  end if;

  if not public.is_admin() then
    raise exception 'Apenas administradores podem solicitar renovação';
  end if;

  select * into row_rec
  from public.app_subscriptions
  order by created_at desc
  limit 1;

  if not found then
    raise exception 'Assinatura não encontrada';
  end if;

  update public.app_subscriptions
  set
    payment_requested_at = now(),
    payment_requested_by = auth.uid(),
    payment_note = nullif(trim(coalesce(p_note, '')), ''),
    payment_method = nullif(trim(coalesce(p_method, '')), ''),
    updated_at = now()
  where id = row_rec.id
  returning * into row_rec;

  return json_build_object(
    'id', row_rec.id,
    'payment_requested_at', row_rec.payment_requested_at,
    'payment_note', row_rec.payment_note,
    'payment_method', row_rec.payment_method,
    'annual_fee', row_rec.annual_fee,
    'status', row_rec.status,
    'ends_at', row_rec.ends_at,
    'is_blocked', row_rec.is_blocked
  );
end;
$$;

revoke all on function public.request_subscription_payment(text, text) from public;
grant execute on function public.request_subscription_payment(text, text) to authenticated;

-- Super Admin confirma pagamento: renova ciclo, activa e desbloqueia
create or replace function public.confirm_subscription_payment()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  row_rec public.app_subscriptions%rowtype;
  today date := current_date;
begin
  if auth.uid() is null or not public.is_super_admin() then
    raise exception 'Apenas o super administrador pode confirmar pagamentos';
  end if;

  select * into row_rec
  from public.app_subscriptions
  order by created_at desc
  limit 1;

  if not found then
    raise exception 'Assinatura não encontrada';
  end if;

  update public.app_subscriptions
  set
    status = 'active',
    is_blocked = false,
    block_reason = null,
    blocked_at = null,
    starts_at = today,
    ends_at = (today + interval '1 year')::date,
    payment_requested_at = null,
    payment_requested_by = null,
    payment_note = null,
    payment_method = null,
    notes = trim(both from coalesce(notes, '') ||
      case when coalesce(notes, '') = '' then '' else E'\n' end ||
      'Pagamento confirmado em ' || to_char(now(), 'YYYY-MM-DD HH24:MI')),
    updated_at = now()
  where id = row_rec.id
  returning * into row_rec;

  return row_to_json(row_rec);
end;
$$;

revoke all on function public.confirm_subscription_payment() from public;
grant execute on function public.confirm_subscription_payment() to authenticated;
