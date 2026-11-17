# Publicação — Vercel, Play Store e App Store

App ID / Bundle ID: `ao.katchiitassi.elavoko`  
Nome: **Katchipitasse Elavoko**

Ordem recomendada: **1) Vercel (web)** → **2) Android (Play Store)** → **3) iOS (App Store, requer Mac)**.

---

## Pré-requisitos de contas

| Plataforma | Conta | Custo aproximado |
|------------|--------|------------------|
| Web | [Vercel](https://vercel.com) | Grátis (Hobby) / pago (Pro) |
| Backend | Supabase (já em uso) | Conforme plano |
| Android | [Google Play Console](https://play.google.com/console) | ~USD 25 (único) |
| iOS | [Apple Developer](https://developer.apple.com) | ~USD 99 / ano |

Ferramentas locais:
- Node.js 20+
- Android Studio (Play Store)
- macOS + Xcode 15+ (App Store — **obrigatório**; não dá para publicar iOS só a partir de Windows)

---

## 0. PWA (instalação no telemóvel)

A app é uma Progressive Web App:

- No telemóvel, ao abrir o link no browser, surge um **modal obrigatório** para instalar (outras áreas ficam bloqueadas até instalar).
- Quando há nova versão publicada, o utilizador vê um aviso **Nova actualização** (e notificação do sistema, se autorizar).
- Desktop e app Capacitor nativa **não** são bloqueados por este modal.

Requisitos: HTTPS (Vercel), ícones em `public/pwa/`, service worker gerado pelo `vite-plugin-pwa`.

Após cada deploy, os clientes actualizam ao aceitar o aviso de actualização.

---

## 1. Vercel (web)

### 1.1 Variáveis de ambiente (Vercel → Project → Settings → Environment Variables)

Defina **apenas** variáveis públicas `VITE_*` (Production + Preview):

| Variável | Exemplo | Notas |
|----------|---------|--------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | URL do projecto |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` ou `sb_publishable_...` | **Anon / publishable** — nunca a secret |
| `VITE_APP_URL` | `https://seu-projecto.vercel.app` | URL canónica (partilhas, redirects) |

**Nunca** coloque no Vercel: `SUPABASE_SECRET_KEY`, passwords de seed, keystores.

Após ligar domínio próprio, actualize `VITE_APP_URL` e faça redeploy.

### 1.2 Deploy

1. Faça push do repositório para GitHub/GitLab/Bitbucket.
2. Em [vercel.com](https://vercel.com) → **Add New Project** → importe o repo.
3. Framework Preset: **Vite** (Build Command `npm run build`, Output `dist`).
4. Confirme que [`vercel.json`](../vercel.json) está no root (rewrites SPA para React Router).
5. Adicione as env vars acima → **Deploy**.

Comandos locais equivalentes:

```bash
npm install
npm run build
npx vercel --prod   # se tiver CLI Vercel autenticada
```

### 1.3 Supabase Auth (após o primeiro URL)

No Supabase → **Authentication** → **URL Configuration**:

1. **Site URL** = `https://<project>.vercel.app` (ou o domínio custom).
2. **Redirect URLs** (adicionar):
   - `https://<project>.vercel.app/**`
   - `https://<project>.vercel.app/redefinir-password`
   - (se existir) `https://seu-dominio.ao/**`
3. Confirme que o provider **Email** está activo.

### 1.4 Checklist pós-deploy web

- [ ] Home, login, restaurante, hospedaria e contactos abrem sem 404 em refresh
- [ ] Login / registo / recuperar password funcionam
- [ ] Pedido e reserva criam registos (admin vê no painel)
- [ ] Migrations aplicadas no Supabase (incl. `010_public_page_images.sql` se usar imagens públicas)
- [ ] `VITE_APP_URL` coincide com o URL público

---

## 2. Capacitor — plataformas nativas

As pastas `android/` e `ios/` são geradas localmente (estão no `.gitignore`). Em cada máquina de build:

```bash
npm install
# .env de PRODUÇÃO com VITE_* correctos (embutidos no build web)
npx cap add android   # uma vez
npx cap add ios       # uma vez — preferencialmente num Mac
npm run cap:sync      # build web + copia para nativo
```

Scripts úteis:

| Comando | Descrição |
|---------|-----------|
| `npm run cap:sync` | `vite build` + `cap sync` |
| `npm run cap:android` | Sync + abrir Android Studio |
| `npm run cap:ios` | Sync + abrir Xcode (macOS) |
| `npm run cap:add` | Adicionar android + ios se ainda não existirem |

**Importante:** o build nativo embute o `dist/` gerado com as `VITE_*` do `.env` local. Antes de sync para loja, use o mesmo Supabase/URL de produção.

Opcional — versionar `android/`/`ios/` no Git depois do primeiro sync estável (útil para CI). Até lá, regenerar com `cap add` + `cap sync`.

### Ícones e splash

Substitua os assets gerados pelo logo oficial (`public/logo.png`).  
Opcional: `@capacitor/assets` a partir de um master 1024×1024.

---

## 3. Android — Google Play Store

### 3.1 Abrir o projecto

```bash
npm run cap:android
```

Confirme em `android/app/build.gradle` (ou via Android Studio):

- `applicationId` / namespace: `ao.katchiitassi.elavoko`
- `versionCode` (inteiro, incrementa a cada upload)
- `versionName` (ex.: `1.0.0`)

### 3.2 Keystore de release (fora do Git)

```bash
keytool -genkey -v -keystore katchipitasse-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias katchipitasse
```

Guarde o `.jks` e as passwords num cofre (1Password, etc.). Sem este ficheiro **não** consegue actualizar a app na Play Store.

Configure signing em Android Studio (**Build** → **Generate Signed Bundle / APK**) ou via `keystore.properties` local (não commitado).

### 3.3 Gerar AAB

1. **Build** → **Generate Signed Bundle / APK** → **Android App Bundle**.
2. Use o keystore de release.
3. Output típico: `android/app/release/app-release.aab`.

### 3.4 Play Console

1. Criar app → nome **Katchipitasse Elavoko**, tipo App, gratuito/pago conforme negócio.
2. Preencher ficha da loja: descrição, screenshots (telefone), ícone 512×512, feature graphic.
3. Política de privacidade: URL público `https://<seu-dominio>/privacidade`.
4. Classificação de conteúdo, público-alvo, declaração de dados.
5. **Production** (ou Internal testing) → upload do `.aab` → revisão Google.

### 3.5 Teste rápido

- Instalar build de debug/release num dispositivo com a conta de teste.
- Validar login, pedido, notificações do admin e partilha.

---

## 4. iOS — App Store (requer Mac)

**Não é possível arquivar nem enviar para a App Store apenas a partir de Windows.** Use um Mac com Xcode ou CI macOS (ex.: Codemagic / GitHub Actions `macos-latest`).

### 4.1 No Mac

```bash
npm install
# .env de produção
npx cap add ios    # se ainda não existir
npm run cap:sync
npm run cap:ios    # abre Xcode
```

### 4.2 Xcode

1. Bundle Identifier: `ao.katchiitassi.elavoko`
2. **Signing & Capabilities** → Team da Apple Developer; Automatic signing.
3. Version / Build number alinhados com a versão da loja.
4. **Product** → **Archive** → **Distribute App** → App Store Connect  
   (ou exportar IPA e enviar com Transporter).

### 4.3 App Store Connect

1. Criar app com o mesmo Bundle ID.
2. Screenshots iPhone, descrição, palavras-chave, URL de privacidade (`/privacidade`).
3. App Privacy (dados recolhidos: conta, contactos, etc. — alinhar com o uso real).
4. Submeter para revisão Apple.

---

## 5. Secrets e segurança (resumo)

| Permitido no frontend / Vercel / APK | Nunca expor |
|--------------------------------------|-------------|
| `VITE_SUPABASE_URL` | `SUPABASE_SECRET_KEY` / service_role |
| `VITE_SUPABASE_ANON_KEY` | Passwords seed |
| `VITE_APP_URL` | Keystore `.jks` e passwords |

RLS no Supabase continua a ser a barreira de segurança; a anon key é pública por desenho.

---

## 6. Rollback rápido

- **Vercel:** redeploy do deployment anterior no dashboard.
- **Play Store:** staged rollout / halt production; subir AAB anterior se necessário.
- **App Store:** remover da venda / submeter build anterior (processo Apple).
