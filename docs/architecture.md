# Architecture — Katchiitassi Elavoko

## Style
SPA única (Vite + React + JS + Tailwind) com duas áreas de UI:
- **App cliente** (`/`) — mobile-first, bottom navigation
- **Admin** (`/admin`) — painel responsivo protegido

Empacotamento móvel via **Capacitor** (mesmo build web).

## Components

```text
[Cliente Mobile / Web]     [Admin Web]
         \                   /
          \                 /
           v               v
        React Router + Context Auth
                   |
                   v
            Supabase JS Client (anon key)
                   |
     +-------------+-------------+
     |             |             |
  Auth          Postgres       Storage
 (email)      (RLS policies)  (images)
```

## Data flow
1. Leitura pública: `dishes`, `categories`, `rooms`, `company_settings` (select RLS público).
2. Escrita cliente: inserts em `orders`/`order_items`/`reservations` com `user_id = auth.uid()`.
3. Disponibilidade: RPC/query SQL que rejeita overlaps.
4. Admin: role em `profiles.role = 'admin'`; policies permitem update/delete amplo.

## Security boundaries
- Frontend só usa anon key.
- RLS em todas as tabelas.
- Trigger cria `profiles` no signup.
- Disponibilidade enforced no DB (constraint/trigger ou função SECURITY DEFINER).

## Environments
- Local: `.env.local` + Supabase project
- Build: `vite build` → `dist/` → Capacitor sync

## Folder structure (target)
```text
src/
  components/
  contexts/
  hooks/
  lib/
  pages/
    app/          # cliente
    admin/        # painel
  services/
  styles/
supabase/
  migrations/
```
