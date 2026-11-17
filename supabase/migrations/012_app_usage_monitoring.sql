-- Monitorização de uso da app (quem / quando / como) — visível ao super_admin

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

create table if not exists public.app_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  guest_key text,
  role text,
  event_type text not null
    check (event_type in ('session_start', 'page_view', 'login', 'order', 'reservation')),
  path text,
  channel text not null default 'unknown'
    check (channel in ('web', 'pwa', 'native', 'unknown')),
  user_agent text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_usage_events_created_idx on public.app_usage_events (created_at desc);
create index if not exists app_usage_events_user_idx on public.app_usage_events (user_id, created_at desc);
create index if not exists app_usage_events_type_idx on public.app_usage_events (event_type, created_at desc);

alter table public.app_usage_events enable row level security;

grant select, insert on public.app_usage_events to anon, authenticated;

drop policy if exists "usage_insert_own_or_anon" on public.app_usage_events;
create policy "usage_insert_own_or_anon"
  on public.app_usage_events for insert
  with check (
    user_id is null
    or auth.uid() = user_id
  );

drop policy if exists "usage_select_super" on public.app_usage_events;
create policy "usage_select_super"
  on public.app_usage_events for select
  using (public.is_super_admin());

-- Actualizar last_seen do próprio perfil
create or replace function public.touch_profile_last_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  update public.profiles
  set last_seen_at = now()
  where id = auth.uid();
end;
$$;

revoke all on function public.touch_profile_last_seen() from public;
grant execute on function public.touch_profile_last_seen() to authenticated;

-- Resumo para o painel do super_admin
create or replace function public.get_platform_usage_summary(p_hours int default 24)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  since timestamptz := now() - make_interval(hours => greatest(p_hours, 1));
  result jsonb;
begin
  if not public.is_super_admin() then
    raise exception 'Apenas super_admin';
  end if;

  select jsonb_build_object(
    'since', since,
    'hours', p_hours,
    'events_total', (select count(*)::int from public.app_usage_events where created_at >= since),
    'sessions', (
      select count(*)::int from public.app_usage_events
      where created_at >= since and event_type = 'session_start'
    ),
    'page_views', (
      select count(*)::int from public.app_usage_events
      where created_at >= since and event_type = 'page_view'
    ),
    'unique_users', (
      select count(distinct user_id)::int from public.app_usage_events
      where created_at >= since and user_id is not null
    ),
    'unique_guests', (
      select count(distinct guest_key)::int from public.app_usage_events
      where created_at >= since and user_id is null and guest_key is not null
    ),
    'by_channel', coalesce((
      select jsonb_object_agg(channel, cnt)
      from (
        select channel, count(*)::int as cnt
        from public.app_usage_events
        where created_at >= since
        group by channel
      ) c
    ), '{}'::jsonb),
    'by_role', coalesce((
      select jsonb_object_agg(coalesce(role, 'anonimo'), cnt)
      from (
        select role, count(*)::int as cnt
        from public.app_usage_events
        where created_at >= since
        group by role
      ) r
    ), '{}'::jsonb),
    'top_paths', coalesce((
      select jsonb_agg(jsonb_build_object('path', path, 'count', cnt) order by cnt desc)
      from (
        select coalesce(path, '/') as path, count(*)::int as cnt
        from public.app_usage_events
        where created_at >= since and event_type = 'page_view'
        group by coalesce(path, '/')
        order by cnt desc
        limit 10
      ) t
    ), '[]'::jsonb),
    'active_profiles', (
      select count(*)::int from public.profiles
      where last_seen_at >= since
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_platform_usage_summary(int) from public;
grant execute on function public.get_platform_usage_summary(int) to authenticated;
