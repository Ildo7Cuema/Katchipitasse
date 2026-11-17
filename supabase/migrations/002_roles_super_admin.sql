-- Roles: cliente | admin (dono da loja) | super_admin (produtor do software)

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('cliente', 'admin', 'super_admin'));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'super_admin'
  );
$$;

-- Remover trigger antigo (se a execução anterior falhou a meio)
drop trigger if exists profiles_protect_role on public.profiles;

-- Promover seeds ANTES de activar a protecção de papéis
update public.profiles
set role = 'super_admin',
    full_name = coalesce(nullif(full_name, ''), 'Ildo Marques')
where lower(email) = lower('ildocuema@gmail.com');

update public.profiles
set role = 'admin',
    full_name = coalesce(nullif(full_name, ''), 'Administrador da Loja')
where lower(email) = lower('dono@katchipitasse.ao');

-- Protecção: só bloqueia alterações feitas por utilizadores autenticados na app.
-- Sessões sem auth.uid() (SQL Editor / migrations) podem fazer bootstrap.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null and not public.is_super_admin() then
      raise exception 'Apenas o super administrador pode alterar papéis de utilizadores';
    end if;

    if old.role = 'super_admin' and new.role <> 'super_admin' then
      if (select count(*)::int from public.profiles where role = 'super_admin') <= 1 then
        raise exception 'Não é possível remover o último super administrador';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_protect_role
  before update of role on public.profiles
  for each row execute function public.protect_profile_role();

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());
