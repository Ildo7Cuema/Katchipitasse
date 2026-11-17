# Katchiitassi Elavoko — Product Overview

## Product name
**Katchiitassi Elavoko** — aplicação móvel + painel administrativo web

## Problem
A empresa presta serviços de restaurante e hospedaria, mas os clientes não têm um canal digital simples para conhecer serviços, solicitar refeições, pedir reservas de quartos e contactar a empresa. A gestão interna de pedidos e reservas é manual e dispersa.

## Proposed solution
Aplicação móvel leve (Android/iOS via Capacitor) para clientes e painel web administrativo para a equipa, ambos ligados ao Supabase (PostgreSQL, Auth, Storage).

## Main objective
Facilitar a comunicação entre a empresa e os clientes: apresentação de serviços, solicitações de refeições, pedidos de reserva de quartos, partilha social e gestão administrativa — sem pagamentos electrónicos nesta versão.

## Target users
- **Cliente**: consulta pública, autenticação opcional para pedidos/reservas/histórico
- **Administrador**: gestão completa via painel web autenticado

## Stakeholders

| Stakeholder | Role | Main need |
|-------------|------|-----------|
| Proprietário / gestão | Decisor | Canal digital simples e profissional |
| Equipa operacional | Operador admin | Confirmar pedidos e reservas |
| Cliente final | Utilizador | Pedir refeições e reservar quartos |
| Equipa técnica | Desenvolvimento | Stack estável e manutenção fácil |

## User groups

| User | Responsibilities | Access level |
|------|------------------|--------------|
| Visitante anónimo | Ver home, pratos, quartos, contactos, partilhar | Público |
| Cliente autenticado | Pedidos, reservas, perfil, histórico | Próprios dados |
| Administrador | CRUD serviços, estados, clientes, configurações | Total admin |

## Product modules
1. **Home** — identidade, destaques, atalhos
2. **Restaurante** — catálogo, detalhes, solicitação, estados
3. **Hospedaria** — quartos, disponibilidade, reserva, estados
4. **Autenticação & Perfil** — registo, login, recuperação, histórico
5. **Contactos & Partilha** — contactos configuráveis + share nativo
6. **Admin Web** — dashboard, CRUD, configurações

## MVP (MoSCoW)
- **MUST**: home, restaurante, hospedaria com disponibilidade, auth, contactos, partilha, admin básico, RLS
- **SHOULD**: recuperação de password, gestão de fotos via Storage, splash/ícone Capacitor
- **COULD**: animações premium, filtros avançados
- **FUTURE**: pagamentos, stock, fidelização, facturação, RH

## Confirmed business rules
1. Sem pagamentos electrónicos v1 — confirmação/pagamento offline com a empresa
2. Pedidos/reservas só após autenticação
3. Consulta pública sem cadastro
4. Reserva só fica **confirmada** após validação administrativa
5. Impedir sobreposição de reservas no mesmo quarto/período (excepto canceladas)
6. Estados pedidos: pendente → confirmado → em_preparacao → concluido | cancelado
7. Estados reservas: pendente → confirmada → ocupada → concluida | cancelada
8. Credenciais Service Role nunca no frontend

## Integrations
- Supabase Auth / PostgreSQL / Storage
- Google Maps (link externo)
- Share nativo do dispositivo (WhatsApp, Facebook, Instagram, etc.)
- Capacitor (Android/iOS)

## Non-functional expectations
- Mobile-first, responsivo, premium mas simples
- Segurança via RLS + roles
- Loading / success / error states
- Imagens optimizadas
- PT (português) na UI

## Risks & constraints
- Credenciais Supabase ainda não configuradas no ambiente
- Dados reais da empresa (telefone, morada, logo) a configurar no admin
- Publicação nas lojas depende de contas developer Apple/Google

## Open questions (não bloqueiam MVP)
- Dados oficiais finais de contacto/redes (configuráveis)
- Identidade visual oficial (paleta provisória harmoniosa até logo final)

## HANDOFF TO REQUIREMENTS ANALYSIS
Produto definido: app cliente + admin web para restaurante/hospedaria, stack React+Vite+JS+Tailwind+Capacitor+Supabase, MVP sem pagamentos, com verificação de disponibilidade de quartos e confirmação administrativa.
