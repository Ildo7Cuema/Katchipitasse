-- Activar realtime para notificações do admin da loja

do $$
begin
  begin
    alter publication supabase_realtime add table public.orders;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.reservations;
  exception
    when duplicate_object then null;
  end;
end $$;
