# Papéis de autenticação

| Papel | Conta seed | Responsabilidades |
|-------|------------|-------------------|
| `super_admin` | `SEED_SUPERADMIN_EMAIL` no `.env` | Produtor do software. Monitorização, assinatura da app, GPO/gateway da plataforma, regras e papéis. |
| `admin` | `SEED_STOREADMIN_EMAIL` no `.env` | Dono da loja. Operação (pratos, quartos, pedidos, reservas, clientes), GPO/gateway dos clientes. |
| `cliente` | registo público | Pedidos, reservas e histórico próprios |

**Segurança:** passwords de seed vivem apenas no `.env` local (nunca no Git). Em produção, rode o seed uma vez e altere as passwords imediatamente. Rode também as migrations `007`–`009`.

## Menu do Super Admin
- `/admin` — Monitorização
- `/admin/assinaturas` — Plano e bloqueio
- `/admin/pagamentos` — GPO + gateway da app
- `/admin/regras` — Políticas do sistema
- `/admin/plataforma` — Hub de configurações
- `/admin/utilizadores` — Papéis

## Menu do Admin da loja
- Dashboard, Categorias, Pratos, Quartos, Pedidos, Reservas, Clientes, Assinatura, Pagamentos (GPO clientes), Configurações

## Migrations (ordem)
1. `001` … `006` (base + assinatura + realtime + pedido de pagamento)
2. `007_payment_gpo.sql`
3. `008_payment_gateway_credentials.sql`
4. `009_security_hardening.sql`
5. `npm run seed:admins` (com variáveis SEED_* no `.env`)
