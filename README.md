# Katchipitasse Elavoko

Aplicação móvel + painel administrativo para restaurante e hospedaria.

**Stack:** React · JavaScript · Vite · Tailwind CSS · Capacitor · Supabase

## Funcionalidades

### App do cliente
- Página inicial com identidade, destaques e contacto rápido
- Restaurante: categorias, detalhes, solicitação de refeições e estados
- Hospedaria: quartos, verificação de disponibilidade, pedidos de reserva
- Autenticação, perfil, histórico, recuperação de palavra-passe
- Partilha nativa (WhatsApp / redes do dispositivo)
- Contactos configuráveis + política de privacidade

### Painel admin (`/admin`)
- Dashboard, categorias, pratos, quartos, pedidos, reservas, clientes e páginas públicas
- Papéis: `admin` (loja) e `super_admin` (plataforma)

## Arranque local

```bash
npm install
cp .env.example .env
# Preencher VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY e VITE_APP_URL
npm run dev
```

Sem Supabase configurado, a app corre em **modo demonstração** (catálogo local, sem pedidos/reservas reais).

## Produção (resumo)

1. **Web (Vercel)** — importar o repo, definir `VITE_*`, deploy. Ver [`docs/deployment.md`](docs/deployment.md).
2. **Android (Play Store)** — `npm run cap:add` / `npm run cap:android` → AAB assinado → Play Console.
3. **iOS (App Store)** — requer **Mac** + Xcode → Archive → App Store Connect.

App ID: `ao.katchiitassi.elavoko`

## Configurar Supabase

1. Criar projecto em [supabase.com](https://supabase.com)
2. SQL Editor → executar as migrations em `supabase/migrations/` (por ordem)
3. (Opcional) executar `supabase/seed.sql` só em desenvolvimento
4. Authentication → activar Email provider
5. Copiar URL e **anon key** para `.env` (nunca a service role)
6. Em produção, configurar Site URL e Redirect URLs com o domínio Vercel
7. Contas admin: `npm run seed:admins` (com secrets só no `.env` local)

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento web |
| `npm run build` | Build de produção |
| `npm run cap:sync` | Build + sync Capacitor |
| `npm run cap:add` | Adicionar plataformas android + ios |
| `npm run cap:android` | Sync + abrir Android Studio |
| `npm run cap:ios` | Sync + abrir Xcode (macOS) |
| `npm run seed:admins` | Criar/actualizar admins seed |

## Documentação

- [`docs/deployment.md`](docs/deployment.md) — Vercel, Play Store, App Store
- `docs/project-overview.md`
- `docs/requirements.md`
- `docs/architecture.md`
- `docs/database.md`
- `docs/uiux.md`

## Segurança

- RLS activo nas tabelas
- Disponibilidade de quartos enforced na base de dados
- Apenas anon / publishable key no frontend e na Vercel
- Secret key e keystores só em ambiente local seguro
