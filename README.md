<p align="center">
  <img src="brand/logo.svg" alt="Carretel" width="320">
</p>

<p align="center">
  <strong>O caderno digital do taller de costura. Registra, Comprueba y Cobra / Registra, Comprova e Cobra.</strong>
</p>

<p align="center">
  <img alt="Next.js 16.4.6" src="https://img.shields.io/badge/Next.js-16.4.6-121D29?logo=nextdotjs&logoColor=FEFCF8">
  <img alt="React 19.3.1" src="https://img.shields.io/badge/React-19.3.1-1C4066?logo=react&logoColor=FEFCF8">
  <img alt="TypeScript strict" src="https://img.shields.io/badge/TypeScript-strict-1C4066?logo=typescript&logoColor=FEFCF8">
  <img alt="Tailwind CSS 4.3.5" src="https://img.shields.io/badge/Tailwind_CSS-4.3.5-1C4066?logo=tailwindcss&logoColor=FEFCF8">
  <img alt="Neon Postgres" src="https://img.shields.io/badge/Neon-Postgres_%2B_Auth-143C1F?logo=postgresql&logoColor=FEFCF8">
  <img alt="Drizzle ORM 0.45.4" src="https://img.shields.io/badge/Drizzle_ORM-0.45.4-143C1F?logo=drizzle&logoColor=FEFCF8">
  <img alt="PWA offline" src="https://img.shields.io/badge/PWA-offline_first-6D4D09">
  <img alt="i18n ES e PT-BR" src="https://img.shields.io/badge/i18n-ES_%7C_PT--BR-643666">
  <img alt="WCAG 2.2 AA" src="https://img.shields.io/badge/WCAG-2.2_AA-093A3F">
  <img alt="pnpm" src="https://img.shields.io/badge/pnpm-12-4F2611?logo=pnpm&logoColor=FEFCF8">
</p>

---

## O que é

SaaS mobile-first, bilíngue (espanhol e português) e resiliente a sinal fraco para donos e donas de talleres de costura da comunidade boliviana no Brasil. Faz só três coisas:

- **Registrar**: corte recebido com foto, quantidade e preço por voz, grade, prazo e aviamentos; produção por pessoa, operação e máquina; vales.
- **Comprovar**: link público `/c/[token]` com fotos, grade, valor e código de verificação. O contratante confirma pelo WhatsApp, sem criar conta. O registro guarda IP, navegador e horário, e o snapshot fica imutável no banco depois do aceite.
- **Cobrar**: quem me deve e há quantos dias, mensagem pronta para o WhatsApp com Pix Copia e Cola (BR Code com CRC16) e QR, baixa total ou parcial.

Também tem acerto semanal com recibo bilíngue e alerta educativo de piso diário (CLT art. 78), calculadora de preço justo por peça, assinatura de R$ 35/mês (AbacatePay v2) com modo leitura que nunca sequestra dados, exportação LGPD e exclusão de conta.

## Stack

| Camada | Escolha |
|---|---|
| Framework | Next.js 16.4.6 (App Router, `src/proxy.ts`), React 19.3.1, TypeScript strict |
| Estilo | Tailwind CSS 4.3.5 com os tokens OKLCH de `src/styles/tokens.css`, fonte Montserrat |
| i18n | next-intl 4.15.1 (`es` padrão, `pt-BR`), troca com um toque |
| Banco | Neon Postgres com Drizzle ORM 0.45.4 (`node-postgres` + `attachDatabasePool`). Sem `DATABASE_URL`, roda com PGlite local |
| Auth | Neon Auth (Managed Better Auth), OTP de 6 dígitos por e-mail, sem senha |
| Multi-tenant | `tenantDb(workshopId)` obrigatório, com teste de isolamento contra Postgres real |
| Offline | Fila IndexedDB idempotente (`client_mutation_id` UUID v7) + `/api/sync` + service worker |
| Pagamentos | AbacatePay API v2 (webhook com segredo em tempo constante + HMAC-SHA256); modo simulado em desenvolvimento |
| Acessibilidade | WCAG 2.2 AA, alvos de 48 a 56px, widget de acessibilidade com portais dentro de `#app` |

## Como rodar

```bash
pnpm install
pnpm dev
```

Abra `http://localhost:3000`. Sem variáveis de ambiente o app usa o Postgres local embutido e o login de desenvolvimento (o código aparece na tela e no console).

Com o Neon configurado (`neon deploy` escreve o `.env.local`):

```bash
pnpm db:migrate
pnpm dev
```

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm dev:https` | Desenvolvimento com HTTPS (PWA, câmera e microfone no celular) |
| `pnpm build` | Build de produção |
| `pnpm lint` | ESLint (jsx-a11y) + guardrails do projeto |
| `pnpm typecheck` | TypeScript |
| `pnpm test` | Vitest: Pix/CRC16, parser de voz ES/PT, acerto (fast-check), CLT 78, calculadora, assinatura, webhook, isolamento multi-tenant e triggers |
| `pnpm db:generate` / `pnpm db:migrate` | Migrações Drizzle (usa `DATABASE_URL_UNPOOLED`) |
| `pnpm icons` | Gera os ícones PWA, maskable e Apple a partir da marca |
| `pnpm screenshots` | Captura as telas do manifest com dados fictícios |

## Estrutura

```
src/
  proxy.ts                 next-intl + checagem otimista de sessão (Neon Auth)
  app/[locale]/            telas (app), páginas públicas, auth, /c/[token], /r/[token], OG
  app/api/                 sync, upload, mídia, webhook AbacatePay, crons, exportação, auth
  db/                      schema (14 módulos), tenantDb, operações públicas auditáveis
  server/                  regras de negócio e consultas
  lib/                     dinheiro, Pix BR Code, voz, acerto, calculadora, assinatura, offline
  messages/                es.json e pt-BR.json
  config/                  brand.ts e legal.ts (placeholders do Grupo B)
brand/                     logo.svg, logo-mark.svg, logo-mono.svg, app-icon.svg, template OG
drizzle/                   migrações SQL (inclui triggers de imutabilidade)
docs/                      pesquisa, identidade visual e fontes legais
```

## Antes do go-live

- Preencher os dados legais do Grupo B em `src/config/legal.ts` (razão social, CNPJ do SaaS, endereço, e-mail, encarregado LGPD, regime tributário, foro).
- Conferir as normas em `docs/legal/fontes.md` e passar os textos legais pela revisão jurídica e contábil.
- Liberar Pix Automático e Assinaturas na AbacatePay, criar o produto de R$ 35 e o webhook.
- Cadastrar o salário mínimo vigente em `legal_params` (com fonte) para ligar o alerta do piso diário.
- SMTP próprio no Neon Auth, domínio com HTTPS e plano da Vercel compatível com uso comercial.

A página interna `/es/go-live` mostra o que ainda falta.

## Licença

Proprietário. Todos os direitos reservados.
