-- Endurecimento de segurança para produção
-- 1) Disponibilidade de quartos (security definer)
-- 2) Pedidos só com status pendente + preços do catálogo
-- 3) Bloqueio da app imposto no Postgres (não só no React)
-- 4) Gateway: leitura admin mascarada + gravação sem reexpor segredos
-- 5) Storage: só extensões de imagem comuns

-- ---------------------------------------------------------------------------
-- Helpers de estado da app
-- ---------------------------------------------------------------------------
create or replace function public.is_app_operational()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  row_rec public.app_subscriptions%rowtype;
begin
  -- Super Admin nunca fica bloqueado pelas regras de operação da loja
  if public.is_super_admin() then
    return true;
  end if;

  select * into row_rec
  from public.app_subscriptions
  order by created_at desc
  limit 1;

  if not found then
    return true;
  end if;

  if row_rec.is_blocked then
    return false;
  end if;

  if row_rec.status in ('suspended', 'cancelled', 'expired') then
    return false;
  end if;

  if row_rec.ends_at is not null
     and row_rec.ends_at < current_date
     and row_rec.status not in ('trial') then
    return false;
  end if;

  return true;
end;
$$;

revoke all on function public.is_app_operational() from public;
grant execute on function public.is_app_operational() to authenticated, anon;

-- ---------------------------------------------------------------------------
-- H1: disponibilidade de quartos deve ver TODAS as reservas
-- ---------------------------------------------------------------------------
create or replace function public.assert_room_available()
returns trigger
language plpgsql
security definer
set search_path = public
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

-- ---------------------------------------------------------------------------
-- H3: preço e nome do prato vêm sempre do catálogo
-- ---------------------------------------------------------------------------
create or replace function public.enforce_order_item_catalog()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dish_rec public.dishes%rowtype;
begin
  if new.dish_id is null then
    raise exception 'Prato inválido';
  end if;

  select * into dish_rec
  from public.dishes
  where id = new.dish_id
    and is_active = true;

  if not found then
    raise exception 'Prato indisponível';
  end if;

  new.dish_name := dish_rec.name;
  new.unit_price := dish_rec.price;
  return new;
end;
$$;

drop trigger if exists order_items_enforce_catalog on public.order_items;
create trigger order_items_enforce_catalog
  before insert on public.order_items
  for each row execute function public.enforce_order_item_catalog();

-- ---------------------------------------------------------------------------
-- H2 + H5: políticas de insert endurecidas
-- ---------------------------------------------------------------------------
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
  on public.orders for insert
  with check (
    auth.uid() = user_id
    and status = 'pendente'
    and public.is_app_operational()
  );

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own"
  on public.order_items for insert
  with check (
    public.is_app_operational()
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.user_id = auth.uid()
        and o.status = 'pendente'
    )
  );

drop policy if exists "reservations_insert_own" on public.reservations;
create policy "reservations_insert_own"
  on public.reservations for insert
  with check (
    auth.uid() = user_id
    and status = 'pendente'
    and public.is_app_operational()
  );

-- Admin da loja não altera catálogo enquanto a app estiver bloqueada
drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin() and (public.is_super_admin() or public.is_app_operational()));

drop policy if exists "dishes_admin_all" on public.dishes;
create policy "dishes_admin_all"
  on public.dishes for all
  using (public.is_admin())
  with check (public.is_admin() and (public.is_super_admin() or public.is_app_operational()));

drop policy if exists "rooms_admin_all" on public.rooms;
create policy "rooms_admin_all"
  on public.rooms for all
  using (public.is_admin())
  with check (public.is_admin() and (public.is_super_admin() or public.is_app_operational()));

-- ---------------------------------------------------------------------------
-- H4: RPC admin mascarada + save sem reexpor segredos
-- ---------------------------------------------------------------------------
create or replace function public.is_store_admin()
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

create or replace function public.get_payment_gpo_admin(p_scope text)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  row_rec public.payment_gpo%rowtype;
begin
  if p_scope = 'platform' and not public.is_super_admin() then
    raise exception 'Apenas o Super Admin gere o gateway da app';
  end if;
  if p_scope = 'store' and not public.is_store_admin() then
    raise exception 'Apenas o Admin da loja gere o gateway dos clientes';
  end if;

  select * into row_rec from public.payment_gpo where scope = p_scope;
  if not found then
    return json_build_object(
      'scope', p_scope,
      'enabled', false,
      'gateway_enabled', false,
      'gateway_api_key_set', false,
      'gateway_api_secret_set', false,
      'gateway_webhook_secret_set', false
    );
  end if;

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
    'methods', coalesce(row_rec.methods, '[]'::jsonb),
    'instructions', row_rec.instructions,
    'gateway_enabled', row_rec.gateway_enabled,
    'gateway_provider', row_rec.gateway_provider,
    'gateway_environment', row_rec.gateway_environment,
    'gateway_merchant_id', row_rec.gateway_merchant_id,
    'gateway_terminal_id', row_rec.gateway_terminal_id,
    'gateway_entity_id', row_rec.gateway_entity_id,
    'gateway_base_url', row_rec.gateway_base_url,
    'gateway_callback_url', row_rec.gateway_callback_url,
    'gateway_notes', row_rec.gateway_notes,
    'gateway_api_key', null,
    'gateway_api_secret', null,
    'gateway_webhook_secret', null,
    'gateway_api_key_set', nullif(trim(coalesce(row_rec.gateway_api_key, '')), '') is not null,
    'gateway_api_secret_set', nullif(trim(coalesce(row_rec.gateway_api_secret, '')), '') is not null,
    'gateway_webhook_secret_set', nullif(trim(coalesce(row_rec.gateway_webhook_secret, '')), '') is not null,
    'gateway_configured', (
      row_rec.gateway_enabled
      and nullif(trim(coalesce(row_rec.gateway_api_key, '')), '') is not null
      and nullif(trim(coalesce(row_rec.gateway_merchant_id, row_rec.gateway_entity_id, '')), '') is not null
    )
  );
end;
$$;

revoke all on function public.get_payment_gpo_admin(text) from public;
grant execute on function public.get_payment_gpo_admin(text) to authenticated;

create or replace function public.save_payment_gpo(
  p_scope text,
  p_payload jsonb
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  row_rec public.payment_gpo%rowtype;
  v_methods jsonb;
  v_api_key text;
  v_api_secret text;
  v_webhook text;
begin
  if p_scope = 'platform' and not public.is_super_admin() then
    raise exception 'Apenas o Super Admin pode gravar a GPO da app';
  end if;
  if p_scope = 'store' and not public.is_store_admin() then
    raise exception 'O gateway dos clientes é exclusivo do Admin da loja';
  end if;

  select * into row_rec from public.payment_gpo where scope = p_scope;

  v_methods := coalesce(p_payload->'methods', '["transferencia","multicaixa","cash"]'::jsonb);
  if jsonb_typeof(v_methods) <> 'array' then
    v_methods := '["transferencia","multicaixa","cash"]'::jsonb;
  end if;

  -- Só actualiza segredos se o cliente enviar valor não vazio
  v_api_key := nullif(trim(coalesce(p_payload->>'gateway_api_key', '')), '');
  v_api_secret := nullif(trim(coalesce(p_payload->>'gateway_api_secret', '')), '');
  v_webhook := nullif(trim(coalesce(p_payload->>'gateway_webhook_secret', '')), '');

  insert into public.payment_gpo as g (
    scope,
    enabled,
    proof_phone,
    proof_whatsapp,
    account_name,
    bank_name,
    iban,
    multicaixa_entity,
    multicaixa_reference,
    methods,
    instructions,
    gateway_enabled,
    gateway_provider,
    gateway_environment,
    gateway_merchant_id,
    gateway_terminal_id,
    gateway_entity_id,
    gateway_api_key,
    gateway_api_secret,
    gateway_webhook_secret,
    gateway_base_url,
    gateway_callback_url,
    gateway_notes
  )
  values (
    p_scope,
    coalesce((p_payload->>'enabled')::boolean, false),
    nullif(trim(coalesce(p_payload->>'proof_phone', '')), ''),
    nullif(trim(coalesce(p_payload->>'proof_whatsapp', '')), ''),
    nullif(trim(coalesce(p_payload->>'account_name', '')), ''),
    nullif(trim(coalesce(p_payload->>'bank_name', '')), ''),
    nullif(trim(coalesce(p_payload->>'iban', '')), ''),
    nullif(trim(coalesce(p_payload->>'multicaixa_entity', '')), ''),
    nullif(trim(coalesce(p_payload->>'multicaixa_reference', '')), ''),
    v_methods,
    nullif(trim(coalesce(p_payload->>'instructions', '')), ''),
    coalesce((p_payload->>'gateway_enabled')::boolean, false),
    nullif(trim(coalesce(p_payload->>'gateway_provider', '')), ''),
    case when coalesce(p_payload->>'gateway_environment', 'sandbox') = 'production' then 'production' else 'sandbox' end,
    nullif(trim(coalesce(p_payload->>'gateway_merchant_id', '')), ''),
    nullif(trim(coalesce(p_payload->>'gateway_terminal_id', '')), ''),
    nullif(trim(coalesce(p_payload->>'gateway_entity_id', '')), ''),
    v_api_key,
    v_api_secret,
    v_webhook,
    nullif(trim(coalesce(p_payload->>'gateway_base_url', '')), ''),
    nullif(trim(coalesce(p_payload->>'gateway_callback_url', '')), ''),
    nullif(trim(coalesce(p_payload->>'gateway_notes', '')), '')
  )
  on conflict (scope) do update set
    enabled = excluded.enabled,
    proof_phone = excluded.proof_phone,
    proof_whatsapp = excluded.proof_whatsapp,
    account_name = excluded.account_name,
    bank_name = excluded.bank_name,
    iban = excluded.iban,
    multicaixa_entity = excluded.multicaixa_entity,
    multicaixa_reference = excluded.multicaixa_reference,
    methods = excluded.methods,
    instructions = excluded.instructions,
    gateway_enabled = excluded.gateway_enabled,
    gateway_provider = excluded.gateway_provider,
    gateway_environment = excluded.gateway_environment,
    gateway_merchant_id = excluded.gateway_merchant_id,
    gateway_terminal_id = excluded.gateway_terminal_id,
    gateway_entity_id = excluded.gateway_entity_id,
    gateway_api_key = coalesce(excluded.gateway_api_key, g.gateway_api_key),
    gateway_api_secret = coalesce(excluded.gateway_api_secret, g.gateway_api_secret),
    gateway_webhook_secret = coalesce(excluded.gateway_webhook_secret, g.gateway_webhook_secret),
    gateway_base_url = excluded.gateway_base_url,
    gateway_callback_url = excluded.gateway_callback_url,
    gateway_notes = excluded.gateway_notes,
    updated_at = now();

  return public.get_payment_gpo_admin(p_scope);
end;
$$;

revoke all on function public.save_payment_gpo(text, jsonb) from public;
grant execute on function public.save_payment_gpo(text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: restringir uploads a extensões de imagem comuns
-- ---------------------------------------------------------------------------
drop policy if exists "admin_upload_images" on storage.objects;
create policy "admin_upload_images"
  on storage.objects for insert
  with check (
    bucket_id in ('dishes', 'rooms', 'branding')
    and public.is_admin()
    and (public.is_super_admin() or public.is_app_operational())
    and lower(coalesce(substring(name from '\.([^.]+)$'), '')) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
  );

drop policy if exists "admin_update_images" on storage.objects;
create policy "admin_update_images"
  on storage.objects for update
  using (
    bucket_id in ('dishes', 'rooms', 'branding')
    and public.is_admin()
  )
  with check (
    bucket_id in ('dishes', 'rooms', 'branding')
    and public.is_admin()
    and (public.is_super_admin() or public.is_app_operational())
    and lower(coalesce(substring(name from '\.([^.]+)$'), '')) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
  );

-- Escrita GPO: platform → super_admin; store → admin da loja (não super)
drop policy if exists "payment_gpo_write" on public.payment_gpo;
create policy "payment_gpo_write"
  on public.payment_gpo for all
  using (
    (scope = 'platform' and public.is_super_admin())
    or (scope = 'store' and public.is_store_admin())
  )
  with check (
    (scope = 'platform' and public.is_super_admin())
    or (scope = 'store' and public.is_store_admin())
  );

drop policy if exists "payment_gpo_select" on public.payment_gpo;
create policy "payment_gpo_select"
  on public.payment_gpo for select
  using (
    (scope = 'platform' and public.is_super_admin())
    or (scope = 'store' and public.is_store_admin())
  );

-- Perfis: admin não pode elevar papéis via update genérico (trigger já protege;
-- reforço explícito no WITH CHECK)
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
  on public.profiles for update
  using (public.is_admin())
  with check (
    public.is_admin()
    and (
      public.is_super_admin()
      or role = (select p.role from public.profiles p where p.id = profiles.id)
    )
  );
