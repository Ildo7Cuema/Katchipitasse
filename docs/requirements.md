# Requirements — Katchiitassi Elavoko

## Functional requirements

### FR-01 Home
- Exibir logo, hero, apresentação, atalhos restaurante/hospedaria, destaques, contacto rápido e redes sociais (dados de `company_settings`).

### FR-02 Restaurante
- Listar pratos activos por categoria; detalhe com foto, descrição, preço.
- Solicitar refeição (auth): quantidade, observações, nome/telefone; criar `orders` + `order_items` em estado `pendente`.
- Cliente consulta estado do próprio pedido.

### FR-03 Hospedaria
- Listar quartos activos; detalhe com foto, descrição, capacidade, preço/noite.
- Pedido de reserva (auth): check-in, check-out, hóspedes, contacto.
- Validar disponibilidade (sem overlap com reservas não canceladas).
- Estado inicial `pendente`; confirmação só pelo admin.

### FR-04 Auth & Perfil
- Registo: nome, telefone, email, password.
- Login, logout, recuperação de password (Supabase Auth).
- Perfil editável; histórico de pedidos e reservas.

### FR-05 Partilha
- Share nativo de pratos, quartos, serviços e promoções (Capacitor Share / Web Share API).

### FR-06 Contactos
- Telefone, WhatsApp, endereço, Maps, horário, redes — vindos de configurações.

### FR-07 Admin
- Dashboard com contadores.
- CRUD categorias, pratos, quartos (com Storage).
- Gestão de pedidos/reservas e estados.
- Consulta de clientes e histórico.
- Configurações da empresa.
- Acesso restrito a role `admin`.

## Non-functional
- NFR-01 Mobile-first + responsivo admin
- NFR-02 RLS: cliente só próprios dados; público lê catálogo activo
- NFR-03 Validação de formulários
- NFR-04 Env vars públicas apenas (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- NFR-05 Estados loading/erro/vazio/sucesso

## Permissions
| Acção | Anónimo | Cliente | Admin |
|-------|---------|---------|-------|
| Ver pratos/quartos activos | ✓ | ✓ | ✓ |
| Criar pedido/reserva | ✗ | ✓ | ✓ |
| Ver próprios pedidos/reservas | ✗ | ✓ | ✓ |
| Alterar estados / CRUD | ✗ | ✗ | ✓ |
| company_settings write | ✗ | ✗ | ✓ |

## Acceptance criteria (criticos)
1. Visitante navega home/restaurante/hospedaria/contactos sem login.
2. Cliente autenticado cria pedido e vê estado.
3. Cliente não consegue reservar quarto já ocupado no período.
4. Admin confirma/cancela pedidos e reservas.
5. Service role key ausente do bundle frontend.
