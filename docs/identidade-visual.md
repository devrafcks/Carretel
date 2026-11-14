# Identidade visual técnica — Caderno Digital del Taller

> Especificação para o Claude Code (Next.js 16.4.6, Tailwind CSS v4, shadcn/ui v4, `next/font/google`).
> Paleta e contrastes validados por script Python em **13/11/2026, horário de Brasília (UTC-3)**. Conversão OKLCH ↔ sRGB pelas matrizes do CSS Color 4; luminância relativa WCAG 2.2 com linearização sRGB IEC 61966-2-1.
> Arquivo de tokens: [`tokens.css`](./tokens.css). **Não gera arquivos finais de logo/ícone** — só o briefing da seção 7.
> O nome comercial ainda é decisão do Rafael (Grupo A1 em `03-briefing-inputs-rafael.md`). No código, o placeholder é `TallerApp` em `src/config/brand.ts`. As sugestões da seção 1.2 são conceituais.
> Microcopy de exemplo trata o dono do taller no singular (“você” / “tú” evitado: em espanhol use “usted” ou conjugação na 3ª pessoa, alinhado ao tom dos docs 01 e 02). Dados pessoais reais não entram em nenhum exemplo.

---

## 1. Direção de arte, posicionamento e três sugestões de nome

### 1.1 Posicionamento visual

O produto é o **caderno digital do taller**: ferramenta mobile-first, offline-resiliente, para o dono da oficina boliviana no Brasil registrar lotes por foto/voz, emitir comprovante de entrega bilíngue contra calote, acompanhar cobranças Pix, fazer o acerto da equipe (produção − adelantos) e calcular o preço justo por peça. Preço alvo: **R$ 35/mês**.

A interface vive no **chão de fábrica** — celular Android intermediário, iluminação mista (fluorescente + sol na janela), dedos cansados, leitura rápida de valores em R$ e de status de lote. A estética precisa ser:

- **Utilitária e humana**, precisa como um ponto de costura reto — não “app de startup”.
- **Quente o suficiente** para não parecer formulário de banco: papel de ficha de corte / algodão cru, índigo de linha e tinta técnica, terracota de carretel / cerâmica. O calor é sutil, de material, não de cartão-postal.
- **Cirurgicamente legível:** texto principal, valores financeiros e rótulos críticos de status no light mode atingem **WCAG 2.2 AAA (≥ 7:1)**. Bordas de input, anel de foco e ícones funcionais atingem **≥ 3:1** (1.4.11).
- **Sem “AI slop”:** nenhum degradê roxo/neon, nenhum vidro fosco (`backdrop-filter`) como muleta de contraste, nenhum raio de pílula em card, nenhuma ilustração 3D genérica.
- **Sem folclore caricato:** nada de arco-íris andino literal, chullo, arara, padrão inca estampado no UI. A referência cultural está nos **materiais** (papel, linha, barro), não no figurino.

Essa escolha funciona na oficina porque (a) o creme de papel reduz o ofuscamento do branco puro sob lâmpada fria; (b) o índigo profundo segura o contraste dos números mesmo com a tela no brilho médio; (c) o terracota aparece só como acento e como status de conserto — calor sem virar “tema típico”.

### 1.2 Três sugestões de nome bilíngue (ES / PT-BR)

Sugestões **conceituais**, para o Rafael escolher no Grupo A1. **Não houve verificação de registro no INPI, de marca em uso, nem de domínio `.com.br`** nesta sessão. O `short_name` do PWA precisa ter **≤ 12 caracteres** (e a URL, de preferência, sem acento). Até a decisão, o código usa o placeholder `TallerApp`.

| Nome | `short_name` (PWA) | Caracteres | ES | PT-BR | Por que soa natural |
|---|---|---:|---|---|---|
| **Puntada** | `Puntada` | 8 | A pontada / o ponto de costura | Entende-se na comunidade (o termo do ofício é espanhol; em PT-BR “ponto” é o equivalente) | Curto, fácil de falar no Brás e na Feira Kantuta, evoca precisão — um ponto registrado. |
| **Constancia** | `Constancia` | 10 | Constancia = comprovante, atestado | “Constância” também existe; no produto o sentido é o de **prova escrita** | Nomeia a dor nº 1: a prova de entrega contra o calote. |
| **Bitácora** | `Bitacora` | 8 | Bitácora = diário de bordo / caderno de registro | Bitácora é compreensível em PT-BR (caderno de registro) | É o “Caderno Digital del Taller” em uma palavra. No `manifest` e no domínio, usar **Bitacora** sem acento. |

Promessa de trabalho (já nos docs 01 e 02), independentemente do nome final:

> **Caderno Digital del Taller:** *Registra, Comprueba y Cobra / Registra, Comprova e Cobra.*

### 1.3 O que esta identidade *não* é

- Não compete visualmente com “ERP de confecção”. Não parece dashboard corporativo cinza, nem app de moda.
- Não usa nomes, paletas ou metáforas de produtos de facção já existentes no mercado (não citar concorrentes em landing, app, OG, nem README público).
- Não depende de cor sozinha para status: **sempre cor + ícone Lucide + rótulo textual** nas duas línguas.

---

## 2. Paleta completa (OKLCH + HEX)

Light mode (`:root`) é o **padrão da oficina**. Dark mode (`.dark` no `<html>`) é o tema nativo para uso noturno. Os dois estão inteiramente **dentro do gamut sRGB**: o `oklch()` documentado e o HEX comentado em `tokens.css` descrevem a mesma cor (sem clipping oculto).

### 2.1 Light mode (`:root`) — padrão da oficina

| Token | OKLCH | HEX | Uso |
|---|---|---|---|
| `--background` | `oklch(0.9750 0.0120 85.00)` | `#FAF6EE` | Papel de ficha de corte / algodão cru. Fundo da oficina. |
| `--foreground` | `oklch(0.2280 0.0280 250.00)` | `#121D29` | Tinta técnica índigo-quase-preta. Texto principal, valores em R$. |
| `--card` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | Folha um pouco mais clara que o papel. Cards e superfícies elevadas. |
| `--card-foreground` | `oklch(0.2280 0.0280 250.00)` | `#121D29` | Igual ao foreground. |
| `--popover` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | Igual ao card (menus, popovers opacos — sem vidro). |
| `--popover-foreground` | `oklch(0.2280 0.0280 250.00)` | `#121D29` | Igual ao foreground. |
| `--primary` | `oklch(0.3650 0.0780 252.00)` | `#1C4066` | Índigo de linha / tinta técnica. Botões primários, links fortes, marca. |
| `--primary-foreground` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | Creme de papel. Texto sobre primary (AAA no light). |
| `--secondary` | `oklch(0.9320 0.0180 80.00)` | `#EFE7DB` | Linho cru. Botões secundários, chips neutros. |
| `--secondary-foreground` | `oklch(0.2600 0.0300 250.00)` | `#192532` | Tinta índigo um pouco mais suave. |
| `--muted` | `oklch(0.9440 0.0140 85.00)` | `#F1ECE2` | Algodão. Fundos de tabela, skeleton, faixas secundárias. |
| `--muted-foreground` | `oklch(0.4000 0.0280 250.00)` | `#3C4957` | Texto auxiliar. AA+ (no light, AAA). Nunca usar em R$ nem em status crítico. |
| `--accent` | `oklch(0.9360 0.0280 52.00)` | `#FAE5D9` | Poeira de terracota. Hover/seleção, calor sutil. |
| `--accent-foreground` | `oklch(0.3200 0.0700 45.00)` | `#4F2611` | Terracota-tinta. Texto sobre accent. |
| `--destructive` | `oklch(0.3000 0.1100 25.00)` | `#590A0E` | Carmesim de atraso (mesmo sólido de overdue). Exclusão, erro irreversível. |
| `--destructive-foreground` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | Creme sobre destructive. |
| `--border` | `oklch(0.6200 0.0180 80.00)` | `#8C857A` | Borda estrutural interativa (≥ 3:1 no papel/card). |
| `--input` | `oklch(0.5600 0.0220 80.00)` | `#7B7366` | Borda de campo, um pouco mais escura que `--border` (≥ 3:1). |
| `--ring` | `oklch(0.4500 0.0800 252.00)` | `#325780` | Anel de foco (índigo, ≥ 3:1). |
| `--success` | `oklch(0.3200 0.0680 150.00)` | `#143C1F` | Alias do sólido `paid`. Sucesso genérico / Pix recebido. |
| `--success-foreground` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | Creme (light) ou tinta (dark) sobre success. |
| `--warning` | `oklch(0.4450 0.0880 80.00)` | `#6D4D09` | Ocre profundo. Aviso de sistema (não é status de lote). |
| `--warning-foreground` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | Creme (light) ou tinta (dark) sobre warning. |
| `--info` | `oklch(0.4000 0.0550 230.00)` | `#254D60` | Azul-petróleo informativo, distinto do primary. |
| `--info-foreground` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | Creme (light) ou tinta (dark) sobre info. |
| `--chart-1` | `oklch(0.3650 0.0780 252.00)` | `#1C4066` | Série 1: índigo (marca / em costura). |
| `--chart-2` | `oklch(0.3200 0.0680 150.00)` | `#143C1F` | Série 2: verde-floresta (pago). |
| `--chart-3` | `oklch(0.4300 0.0900 48.00)` | `#773F1F` | Série 3: terracota (conserto). |
| `--chart-4` | `oklch(0.4450 0.0880 80.00)` | `#6D4D09` | Série 4: ocre (aviso). |
| `--chart-5` | `oklch(0.4100 0.0950 325.00)` | `#643666` | Série 5: ameixa (pendente). |

#### Status do domínio têxtil / financeiro (light)

Cada status tem superfície `-bg`, texto `-fg` (AAA sobre a superfície e AA+ sobre o papel/card), sólido `-solid` + `-solid-fg` (pílula, AAA) e borda `-border` (≥ 3:1 sobre a superfície, o papel e o card).

| Status | Superfície `-bg` | Texto `-fg` | Sólido `-solid` / `-solid-fg` | Borda `-border` | Ícone + rótulo (obrigatório) |
|---|---|---|---|---|---|
| **paid**<br>Pago / Pagado | `oklch(0.9450 0.0240 150.00)`<br>`#E2F2E5` | `oklch(0.3200 0.0680 150.00)`<br>`#143C1F` | `oklch(0.3200 0.0680 150.00)`<br>`#143C1F`<br>texto `#FEFCF8` | `oklch(0.5000 0.0500 150.00)`<br>`#4F6C54` | `CircleCheck` (lucide) + rótulo “Pago / Pagado” |
| **in-production**<br>Em costura / En costura | `oklch(0.9400 0.0220 252.00)`<br>`#E1EDFA` | `oklch(0.3000 0.0700 252.00)`<br>`#0F2F50` | `oklch(0.4200 0.0780 252.00)`<br>`#2B4F76`<br>texto `#FEFCF8` | `oklch(0.5000 0.0650 252.00)`<br>`#486688` | `Scissors` (lucide) + rótulo “En costura / Em costura” |
| **awaiting-confirmation**<br>Aguardando aceite / Esperando confirmación | `oklch(0.9450 0.0250 325.00)`<br>`#F6E7F6` | `oklch(0.3200 0.0850 325.00)`<br>`#48214A` | `oklch(0.4100 0.0950 325.00)`<br>`#643666`<br>texto `#FEFCF8` | `oklch(0.5200 0.0800 325.00)`<br>`#805982` | `Clock` (lucide) + rótulo “Esperando confirmación / Aguardando aceite” |
| **overdue-calote**<br>Em atraso / Vencido (risco de calote) | `oklch(0.9450 0.0240 25.00)`<br>`#FDE7E5` | `oklch(0.3000 0.1100 25.00)`<br>`#590A0E` | `oklch(0.3000 0.1100 25.00)`<br>`#590A0E`<br>texto `#FEFCF8` | `oklch(0.5000 0.1000 25.00)`<br>`#944A46` | `TriangleAlert` (lucide) + rótulo “Vencido / Em atraso” |
| **rework**<br>Conserto / Arreglo | `oklch(0.9450 0.0220 48.00)`<br>`#FAE9E0` | `oklch(0.3500 0.0800 48.00)`<br>`#5B2B10` | `oklch(0.4300 0.0900 48.00)`<br>`#773F1F`<br>texto `#FEFCF8` | `oklch(0.5400 0.0800 48.00)`<br>`#956045` | `RotateCcw` (lucide) + rótulo “Arreglo / Conserto” |
| **clt-warning**<br>Alerta de piso / jornada (CLT art. 78) | `oklch(0.9400 0.0220 205.00)`<br>`#DBF0F2` | `oklch(0.3200 0.0500 205.00)`<br>`#093A3F` | `oklch(0.3200 0.0500 205.00)`<br>`#093A3F`<br>texto `#FEFCF8` | `oklch(0.5000 0.0450 205.00)`<br>`#436B6F` | `Scale` (lucide) + rótulo “Piso CLT / Jornada” |

**Por que esses eixos de matiz (e por que não “verde vs vermelho” genérico):**

- **`paid`** — Verde-floresta (H=150). Sob protanopia/deuteranopia permanece distinto do carmesim de atraso (ΔE00 luz > 17). Não é o teal-azul que colapsava com o índigo.
- **`in-production`** — Índigo da marca (H=252), o mesmo eixo do `--primary`. Identifica o lote ativo nas máquinas.
- **`awaiting-confirmation`** — Ameixa (H=325). “Pendente” em UI; o ocre/amarelo ficou reservado ao `--warning` genérico e não compete com o carmesim no eixo da tritanopia.
- **`overdue-calote`** — Carmesim profundo (H=25, o sólido mais escuro no light). Risco financeiro — precisa ser inconfundível, com L baixo para texto cream AAA.
- **`rework`** — Terracota de carretel (H=48). Calor têxtil da direção de arte, com L intermediário entre o vencido (mais escuro) e o ocre de warning.
- **`clt-warning`** — Aço / ciano-petróleo (H=205). Alerta trabalhista, não dívida: família fria distinta do carmesim e do terracota.

**Mapeamento para os status do banco (doc 02), para o Claude não inventar cor nova:**

| Enum (Drizzle) | Token visual | Observação |
|---|---|---|
| Lote `received` | `--secondary` / `--muted` | Neutro: o corte chegou, ainda não entrou na máquina. |
| Lote `in_production` | `--in-production-*` | Lote ativo. |
| Lote `ready` | `--info` + ícone `PackageCheck` | Listo para entregar. |
| Lote `delivered` | `--paid-bg` / `--info` + ícone | Entregue; o dinheiro ainda pode estar em aberto (ver recebível). |
| Lote `closed` / `canceled` | `--muted` | Encerrado. |
| Recebível `awaiting_confirmation` | `--awaiting-confirmation-*` | Comprovante enviado, esperando o OK do contratante. |
| Recebível `open` (0–7 dias) | `--aging-ok` (= `paid` sólido, família verde) | Dias em aberto, ainda no prazo combinado. |
| Recebível `open` (8–15 dias) | `--aging-watch` (= `--warning` ocre) | Atenção. |
| Recebível `open` / atrasado (16+ dias) | `--aging-late` (= `--overdue-calote-*`) | Risco de calote. |
| Recebível `disputed` | `--rework-*` | Divergência de quantidade — precisa de acordo, não é (ainda) calote. |
| Recebível `partially_paid` | `--aging-watch` | Baixa parcial. |
| Recebível / acerto `paid` | `--paid-*` | Quitado. |
| Recebível `written_off` | `--muted` + borda `--overdue-calote-border` | “Dar por perdido”, visualmente recuado. |
| Alerta CLT art. 78 / jornada | `--clt-warning-*` | Nunca reutilizar o vermelho de calote: é alerta trabalhista, não dívida. |

Os aliases `--aging-ok`, `--aging-watch` e `--aging-late` já estão em `tokens.css` (pedido D1 do doc 03: cores de atraso 0–7 / 8–15 / 16+).

### 2.2 Dark mode (`.dark`)

Tema nativo do produto (classe no `<html>`). **Não confundir com o “Modo escuro” do SeeB**, que é um `filter: invert(0.9) hue-rotate(180deg)` no `#seeb-content-wrapper` e **não troca estes tokens** (ver seção 4).

No escuro, os sólidos de status são **claros com tinta escura** (inverso do light, para manter AAA e ícone ≥ 3:1 sobre o fundo índigo-carvão).

| Token | OKLCH | HEX | Uso |
|---|---|---|---|
| `--background` | `oklch(0.2050 0.0200 250.00)` | `#101820` | Papel de ficha de corte / algodão cru. Fundo da oficina. |
| `--foreground` | `oklch(0.9300 0.0150 85.00)` | `#ECE7DD` | Tinta técnica índigo-quase-preta. Texto principal, valores em R$. |
| `--card` | `oklch(0.2500 0.0220 250.00)` | `#1A232C` | Folha um pouco mais clara que o papel. Cards e superfícies elevadas. |
| `--card-foreground` | `oklch(0.9300 0.0150 85.00)` | `#ECE7DD` | Igual ao foreground. |
| `--popover` | `oklch(0.2500 0.0220 250.00)` | `#1A232C` | Igual ao card (menus, popovers opacos — sem vidro). |
| `--popover-foreground` | `oklch(0.9300 0.0150 85.00)` | `#ECE7DD` | Igual ao foreground. |
| `--primary` | `oklch(0.7600 0.0700 252.00)` | `#91B5DD` | Índigo de linha / tinta técnica. Botões primários, links fortes, marca. |
| `--primary-foreground` | `oklch(0.1850 0.0320 250.00)` | `#071420` | Creme de papel. Texto sobre primary (AAA no light). |
| `--secondary` | `oklch(0.3000 0.0250 250.00)` | `#242F3A` | Linho cru. Botões secundários, chips neutros. |
| `--secondary-foreground` | `oklch(0.9300 0.0150 85.00)` | `#ECE7DD` | Tinta índigo um pouco mais suave. |
| `--muted` | `oklch(0.2800 0.0200 250.00)` | `#212A33` | Algodão. Fundos de tabela, skeleton, faixas secundárias. |
| `--muted-foreground` | `oklch(0.7600 0.0200 85.00)` | `#B7B0A3` | Texto auxiliar. AA+ (no light, AAA). Nunca usar em R$ nem em status crítico. |
| `--accent` | `oklch(0.3200 0.0400 50.00)` | `#442D20` | Poeira de terracota. Hover/seleção, calor sutil. |
| `--accent-foreground` | `oklch(0.9300 0.0300 70.00)` | `#F5E5D3` | Terracota-tinta. Texto sobre accent. |
| `--destructive` | `oklch(0.7300 0.1100 25.00)` | `#E58C84` | Carmesim de atraso (mesmo sólido de overdue). Exclusão, erro irreversível. |
| `--destructive-foreground` | `oklch(0.1850 0.0320 250.00)` | `#071420` | Creme sobre destructive. |
| `--border` | `oklch(0.5800 0.0250 250.00)` | `#6F7C89` | Borda estrutural interativa (≥ 3:1 no papel/card). |
| `--input` | `oklch(0.6200 0.0280 250.00)` | `#7A8897` | Borda de campo, um pouco mais escura que `--border` (≥ 3:1). |
| `--ring` | `oklch(0.7600 0.0700 252.00)` | `#91B5DD` | Anel de foco (índigo, ≥ 3:1). |
| `--success` | `oklch(0.7800 0.0800 150.00)` | `#93C69D` | Alias do sólido `paid`. Sucesso genérico / Pix recebido. |
| `--success-foreground` | `oklch(0.1850 0.0320 250.00)` | `#071420` | Creme (light) ou tinta (dark) sobre success. |
| `--warning` | `oklch(0.8400 0.0900 80.00)` | `#EAC586` | Ocre profundo. Aviso de sistema (não é status de lote). |
| `--warning-foreground` | `oklch(0.1850 0.0320 250.00)` | `#071420` | Creme (light) ou tinta (dark) sobre warning. |
| `--info` | `oklch(0.7800 0.0500 230.00)` | `#97BED2` | Azul-petróleo informativo, distinto do primary. |
| `--info-foreground` | `oklch(0.1850 0.0320 250.00)` | `#071420` | Creme (light) ou tinta (dark) sobre info. |
| `--chart-1` | `oklch(0.7200 0.0700 252.00)` | `#85A8D0` | Série 1: índigo (marca / em costura). |
| `--chart-2` | `oklch(0.7800 0.0800 150.00)` | `#93C69D` | Série 2: verde-floresta (pago). |
| `--chart-3` | `oklch(0.8700 0.0650 48.00)` | `#F9C8B0` | Série 3: terracota (conserto). |
| `--chart-4` | `oklch(0.8400 0.0900 80.00)` | `#EAC586` | Série 4: ocre (aviso). |
| `--chart-5` | `oklch(0.8000 0.0800 325.00)` | `#D9ACDA` | Série 5: ameixa (pendente). |

| Status | Superfície `-bg` | Texto `-fg` | Sólido `-solid` / `-solid-fg` | Borda `-border` | Ícone + rótulo (obrigatório) |
|---|---|---|---|---|---|
| **paid**<br>Pago / Pagado | `oklch(0.2600 0.0300 150.00)`<br>`#19281C` | `oklch(0.8600 0.0550 150.00)`<br>`#B8DCBE` | `oklch(0.7800 0.0800 150.00)`<br>`#93C69D`<br>texto `#071420` | `oklch(0.6200 0.0500 150.00)`<br>`#718F76` | `CircleCheck` (lucide) + rótulo “Pago / Pagado” |
| **in-production**<br>Em costura / En costura | `oklch(0.2600 0.0320 252.00)`<br>`#182533` | `oklch(0.8600 0.0550 252.00)`<br>`#B8D4F5` | `oklch(0.7200 0.0700 252.00)`<br>`#85A8D0`<br>texto `#071420` | `oklch(0.6000 0.0550 252.00)`<br>`#6883A1` | `Scissors` (lucide) + rótulo “En costura / Em costura” |
| **awaiting-confirmation**<br>Aguardando aceite / Esperando confirmación | `oklch(0.2600 0.0320 325.00)`<br>`#2C1F2D` | `oklch(0.8800 0.0650 325.00)`<br>`#EEC9F0` | `oklch(0.8200 0.0800 325.00)`<br>`#DFB3E1`<br>texto `#071420` | `oklch(0.6400 0.0650 325.00)`<br>`#A17FA2` | `Clock` (lucide) + rótulo “Esperando confirmación / Aguardando aceite” |
| **overdue-calote**<br>Em atraso / Vencido (risco de calote) | `oklch(0.2500 0.0380 25.00)`<br>`#321A18` | `oklch(0.8800 0.0600 25.00)`<br>`#FDC9C4` | `oklch(0.7300 0.1100 25.00)`<br>`#E58C84`<br>texto `#071420` | `oklch(0.6400 0.0900 25.00)`<br>`#BD7670` | `TriangleAlert` (lucide) + rótulo “Vencido / Em atraso” |
| **rework**<br>Conserto / Arreglo | `oklch(0.2600 0.0320 48.00)`<br>`#311F16` | `oklch(0.9000 0.0500 50.00)`<br>`#FBD5C1` | `oklch(0.8700 0.0650 48.00)`<br>`#F9C8B0`<br>texto `#071420` | `oklch(0.6600 0.0650 48.00)`<br>`#B48770` | `RotateCcw` (lucide) + rótulo “Arreglo / Conserto” |
| **clt-warning**<br>Alerta de piso / jornada (CLT art. 78) | `oklch(0.2600 0.0280 205.00)`<br>`#12282A` | `oklch(0.8600 0.0450 205.00)`<br>`#AFDADF` | `oklch(0.8800 0.0500 195.00)`<br>`#B2E2E2`<br>texto `#071420` | `oklch(0.6200 0.0450 205.00)`<br>`#668E93` | `Scale` (lucide) + rótulo “Piso CLT / Jornada” |

---

## 3. Matriz de contraste WCAG 2.2 (verificada)

Método: luminância relativa `L = 0.2126*R + 0.7152*G + 0.0722*B` a partir do sRGB 8-bit (o HEX que o usuário vê), com linearização IEC 61966-2-1 (limiar 0,04045) e razão `(L1 + 0,05) / (L2 + 0,05)`.

Critérios: texto normal **AA ≥ 4,5:1**, com meta **AAA ≥ 7,0:1** para texto principal, valores em R$ e rótulos críticos de status no **light mode**; componentes não-texto (borda de input, anel de foco, borda de status, ícone funcional) **≥ 3,0:1** (WCAG 1.4.11). Bordas puramente decorativas não foram usadas como único meio de identificar controle — `--border`, `--input`, `--ring` e as bordas de status foram medidas como interativas.

**Resultado:** 164 pares críticos medidos (82 em cada tema). **0 falhas.** No light mode, **39/39 pares de texto atingem AAA** (o mais baixo é warning-fg/warning = **7.546:1**). No dark mode, **38/39 pares de texto atingem AAA**; o único AA (ainda acima de 4,5) é `muted-foreground` sobre `muted` (**6.755:1**) — texto auxiliar, **proibido em valores de R$**. Mínimo de UI/borda: light **3.387:1**, dark **3.725:1**.

### 3.1 Light mode

| Par | HEX texto | HEX fundo | Razão | Classe | Mínimo | Resultado |
|---|---|---|---:|---|---:|---|
| texto principal / fundo | `#121D29` | `#FAF6EE` | **15.794:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| texto principal / card | `#121D29` | `#FEFCF8` | **16.615:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| texto principal / popover | `#121D29` | `#FEFCF8` | **16.615:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| card-fg / card | `#121D29` | `#FEFCF8` | **16.615:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| popover-fg / popover | `#121D29` | `#FEFCF8` | **16.615:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| primary-fg / primary (botão, valores em chip) | `#FEFCF8` | `#1C4066` | **10.379:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| secondary-fg / secondary | `#192532` | `#EFE7DB` | **12.665:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| muted-fg / muted (AA min; não usar em R$) | `#3C4957` | `#F1ECE2` | **7.814:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| muted-fg / background | `#3C4957` | `#FAF6EE` | **8.534:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| muted-fg / card | `#3C4957` | `#FEFCF8` | **8.978:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| accent-fg / accent | `#4F2611` | `#FAE5D9` | **10.678:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| destructive-fg / destructive | `#FEFCF8` | `#590A0E` | **13.899:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| success-fg / success | `#FEFCF8` | `#143C1F` | **12.085:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| warning-fg / warning | `#FEFCF8` | `#6D4D09` | **7.546:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| info-fg / info | `#FEFCF8` | `#254D60` | **8.875:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| border / background (1.4.11) | `#8C857A` | `#FAF6EE` | **3.387:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| border / card | `#8C857A` | `#FEFCF8` | **3.563:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| input / background | `#7B7366` | `#FAF6EE` | **4.342:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| input / card | `#7B7366` | `#FEFCF8` | **4.568:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| ring / background | `#325780` | `#FAF6EE` | **6.932:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| ring / card | `#325780` | `#FEFCF8` | **7.292:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| primary sólido / background (ícone funcional) | `#1C4066` | `#FAF6EE` | **9.866:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| destructive / background (ícone) | `#590A0E` | `#FAF6EE` | **13.212:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| success / background (ícone) | `#143C1F` | `#FAF6EE` | **11.488:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-1 / background | `#1C4066` | `#FAF6EE` | **9.866:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-1 / card | `#1C4066` | `#FEFCF8` | **10.379:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-2 / background | `#143C1F` | `#FAF6EE` | **11.488:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-2 / card | `#143C1F` | `#FEFCF8` | **12.085:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-3 / background | `#773F1F` | `#FAF6EE` | **7.746:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-3 / card | `#773F1F` | `#FEFCF8` | **8.148:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-4 / background | `#6D4D09` | `#FAF6EE` | **7.174:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-4 / card | `#6D4D09` | `#FEFCF8` | **7.546:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-5 / background | `#643666` | `#FAF6EE` | **8.615:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-5 / card | `#643666` | `#FEFCF8` | **9.062:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| paid-fg / paid-bg (rótulo crítico) | `#143C1F` | `#E2F2E5` | **10.653:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| paid-fg / background (texto avulso) | `#143C1F` | `#FAF6EE` | **11.488:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| paid-fg / card | `#143C1F` | `#FEFCF8` | **12.085:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| paid-solid-fg / paid-solid (pílula) | `#FEFCF8` | `#143C1F` | **12.085:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| paid-border / paid-bg | `#4F6C54` | `#E2F2E5` | **5.011:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| paid-border / background | `#4F6C54` | `#FAF6EE` | **5.403:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| paid-border / card | `#4F6C54` | `#FEFCF8` | **5.684:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| paid-solid / background (ícone) | `#143C1F` | `#FAF6EE` | **11.488:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| in-production-fg / in-production-bg (rótulo crítico) | `#0F2F50` | `#E1EDFA` | **11.470:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| in-production-fg / background (texto avulso) | `#0F2F50` | `#FAF6EE` | **12.628:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| in-production-fg / card | `#0F2F50` | `#FEFCF8` | **13.284:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| in-production-solid-fg / in-production-solid (pílula) | `#FEFCF8` | `#2B4F76` | **8.255:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| in-production-border / in-production-bg | `#486688` | `#E1EDFA` | **5.011:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| in-production-border / background | `#486688` | `#FAF6EE` | **5.516:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| in-production-border / card | `#486688` | `#FEFCF8` | **5.803:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| in-production-solid / background (ícone) | `#2B4F76` | `#FAF6EE` | **7.847:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| awaiting-confirmation-fg / awaiting-confirmation-bg (rótulo crítico) | `#48214A` | `#F6E7F6` | **11.106:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| awaiting-confirmation-fg / background (texto avulso) | `#48214A` | `#FAF6EE` | **12.237:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| awaiting-confirmation-fg / card | `#48214A` | `#FEFCF8` | **12.873:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| awaiting-confirmation-solid-fg / awaiting-confirmation-solid (pílula) | `#FEFCF8` | `#643666` | **9.062:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| awaiting-confirmation-border / awaiting-confirmation-bg | `#805982` | `#F6E7F6` | **4.818:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| awaiting-confirmation-border / background | `#805982` | `#FAF6EE` | **5.310:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| awaiting-confirmation-border / card | `#805982` | `#FEFCF8` | **5.585:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| awaiting-confirmation-solid / background (ícone) | `#643666` | `#FAF6EE` | **8.615:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| overdue-calote-fg / overdue-calote-bg (rótulo crítico) | `#590A0E` | `#FDE7E5` | **12.030:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| overdue-calote-fg / background (texto avulso) | `#590A0E` | `#FAF6EE` | **13.212:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| overdue-calote-fg / card | `#590A0E` | `#FEFCF8` | **13.899:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| overdue-calote-solid-fg / overdue-calote-solid (pílula) | `#FEFCF8` | `#590A0E` | **13.899:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| overdue-calote-border / overdue-calote-bg | `#944A46` | `#FDE7E5` | **5.331:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| overdue-calote-border / background | `#944A46` | `#FAF6EE` | **5.855:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| overdue-calote-border / card | `#944A46` | `#FEFCF8` | **6.160:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| overdue-calote-solid / background (ícone) | `#590A0E` | `#FAF6EE` | **13.212:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| rework-fg / rework-bg (rótulo crítico) | `#5B2B10` | `#FAE9E0` | **9.899:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| rework-fg / background (texto avulso) | `#5B2B10` | `#FAF6EE` | **10.836:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| rework-fg / card | `#5B2B10` | `#FEFCF8` | **11.399:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| rework-solid-fg / rework-solid (pílula) | `#FEFCF8` | `#773F1F` | **8.148:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| rework-border / rework-bg | `#956045` | `#FAE9E0` | **4.408:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| rework-border / background | `#956045` | `#FAF6EE` | **4.826:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| rework-border / card | `#956045` | `#FEFCF8` | **5.076:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| rework-solid / background (ícone) | `#773F1F` | `#FAF6EE` | **7.746:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| clt-warning-fg / clt-warning-bg (rótulo crítico) | `#093A3F` | `#DBF0F2` | **10.516:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| clt-warning-fg / background (texto avulso) | `#093A3F` | `#FAF6EE` | **11.537:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| clt-warning-fg / card | `#093A3F` | `#FEFCF8` | **12.136:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| clt-warning-solid-fg / clt-warning-solid (pílula) | `#FEFCF8` | `#093A3F` | **12.136:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| clt-warning-border / clt-warning-bg | `#436B6F` | `#DBF0F2` | **4.973:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| clt-warning-border / background | `#436B6F` | `#FAF6EE` | **5.455:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| clt-warning-border / card | `#436B6F` | `#FEFCF8` | **5.739:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| clt-warning-solid / background (ícone) | `#093A3F` | `#FAF6EE` | **11.537:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |

### 3.2 Dark mode

| Par | HEX texto | HEX fundo | Razão | Classe | Mínimo | Resultado |
|---|---|---|---:|---|---:|---|
| texto principal / fundo | `#ECE7DD` | `#101820` | **14.521:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| texto principal / card | `#ECE7DD` | `#1A232C` | **12.903:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| texto principal / popover | `#ECE7DD` | `#1A232C` | **12.903:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| card-fg / card | `#ECE7DD` | `#1A232C` | **12.903:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| popover-fg / popover | `#ECE7DD` | `#1A232C` | **12.903:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| primary-fg / primary (botão, valores em chip) | `#071420` | `#91B5DD` | **8.724:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| secondary-fg / secondary | `#ECE7DD` | `#242F3A` | **11.046:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| muted-fg / muted (AA min; não usar em R$) | `#B7B0A3` | `#212A33` | **6.755:1** | AA (≥ 4,5) | 4.5:1 | PASS |
| muted-fg / background | `#B7B0A3` | `#101820` | **8.310:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| muted-fg / card | `#B7B0A3` | `#1A232C` | **7.384:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| accent-fg / accent | `#F5E5D3` | `#442D20` | **10.372:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| destructive-fg / destructive | `#071420` | `#E58C84` | **7.448:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| success-fg / success | `#071420` | `#93C69D` | **9.562:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| warning-fg / warning | `#071420` | `#EAC586` | **11.354:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| info-fg / info | `#071420` | `#97BED2` | **9.391:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| border / background (1.4.11) | `#6F7C89` | `#101820` | **4.193:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| border / card | `#6F7C89` | `#1A232C` | **3.725:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| input / background | `#7A8897` | `#101820` | **4.939:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| input / card | `#7A8897` | `#1A232C` | **4.389:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| ring / background | `#91B5DD` | `#101820` | **8.400:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| ring / card | `#91B5DD` | `#1A232C` | **7.464:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| primary sólido / background (ícone funcional) | `#91B5DD` | `#101820` | **8.400:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| destructive / background (ícone) | `#E58C84` | `#101820` | **7.171:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| success / background (ícone) | `#93C69D` | `#101820` | **9.207:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-1 / background | `#85A8D0` | `#101820` | **7.251:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-1 / card | `#85A8D0` | `#1A232C` | **6.443:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-2 / background | `#93C69D` | `#101820` | **9.207:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-2 / card | `#93C69D` | `#1A232C` | **8.181:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-3 / background | `#F9C8B0` | `#101820` | **11.859:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-3 / card | `#F9C8B0` | `#1A232C` | **10.537:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-4 / background | `#EAC586` | `#101820` | **10.932:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-4 / card | `#EAC586` | `#1A232C` | **9.714:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-5 / background | `#D9ACDA` | `#101820` | **9.257:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| chart-5 / card | `#D9ACDA` | `#1A232C` | **8.226:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| paid-fg / paid-bg (rótulo crítico) | `#B8DCBE` | `#19281C` | **10.296:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| paid-fg / background (texto avulso) | `#B8DCBE` | `#101820` | **11.946:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| paid-fg / card | `#B8DCBE` | `#1A232C` | **10.615:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| paid-solid-fg / paid-solid (pílula) | `#071420` | `#93C69D` | **9.562:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| paid-border / paid-bg | `#718F76` | `#19281C` | **4.328:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| paid-border / background | `#718F76` | `#101820` | **5.021:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| paid-border / card | `#718F76` | `#1A232C` | **4.462:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| paid-solid / background (ícone) | `#93C69D` | `#101820` | **9.207:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| in-production-fg / in-production-bg (rótulo crítico) | `#B8D4F5` | `#182533` | **10.193:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| in-production-fg / background (texto avulso) | `#B8D4F5` | `#101820` | **11.737:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| in-production-fg / card | `#B8D4F5` | `#1A232C` | **10.429:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| in-production-solid-fg / in-production-solid (pílula) | `#071420` | `#85A8D0` | **7.531:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| in-production-border / in-production-bg | `#6883A1` | `#182533` | **3.959:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| in-production-border / background | `#6883A1` | `#101820` | **4.559:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| in-production-border / card | `#6883A1` | `#1A232C` | **4.051:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| in-production-solid / background (ícone) | `#85A8D0` | `#101820` | **7.251:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| awaiting-confirmation-fg / awaiting-confirmation-bg (rótulo crítico) | `#EEC9F0` | `#2C1F2D` | **10.625:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| awaiting-confirmation-fg / background (texto avulso) | `#EEC9F0` | `#101820` | **12.141:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| awaiting-confirmation-fg / card | `#EEC9F0` | `#1A232C` | **10.788:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| awaiting-confirmation-solid-fg / awaiting-confirmation-solid (pílula) | `#071420` | `#DFB3E1` | **10.330:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| awaiting-confirmation-border / awaiting-confirmation-bg | `#A17FA2` | `#2C1F2D` | **4.529:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| awaiting-confirmation-border / background | `#A17FA2` | `#101820` | **5.175:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| awaiting-confirmation-border / card | `#A17FA2` | `#1A232C` | **4.598:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| awaiting-confirmation-solid / background (ícone) | `#DFB3E1` | `#101820` | **9.947:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| overdue-calote-fg / overdue-calote-bg (rótulo crítico) | `#FDC9C4` | `#321A18` | **11.051:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| overdue-calote-fg / background (texto avulso) | `#FDC9C4` | `#101820` | **12.209:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| overdue-calote-fg / card | `#FDC9C4` | `#1A232C` | **10.849:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| overdue-calote-solid-fg / overdue-calote-solid (pílula) | `#071420` | `#E58C84` | **7.448:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| overdue-calote-border / overdue-calote-bg | `#BD7670` | `#321A18` | **4.619:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| overdue-calote-border / background | `#BD7670` | `#101820` | **5.103:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| overdue-calote-border / card | `#BD7670` | `#1A232C` | **4.535:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| overdue-calote-solid / background (ícone) | `#E58C84` | `#101820` | **7.171:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| rework-fg / rework-bg (rótulo crítico) | `#FBD5C1` | `#311F16` | **11.500:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| rework-fg / background (texto avulso) | `#FBD5C1` | `#101820` | **13.114:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| rework-fg / card | `#FBD5C1` | `#1A232C` | **11.653:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| rework-solid-fg / rework-solid (pílula) | `#071420` | `#F9C8B0` | **12.316:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| rework-border / rework-bg | `#B48770` | `#311F16` | **4.962:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| rework-border / background | `#B48770` | `#101820` | **5.658:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| rework-border / card | `#B48770` | `#1A232C` | **5.028:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| rework-solid / background (ícone) | `#F9C8B0` | `#101820` | **11.859:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| clt-warning-fg / clt-warning-bg (rótulo crítico) | `#AFDADF` | `#12282A` | **10.213:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| clt-warning-fg / background (texto avulso) | `#AFDADF` | `#101820` | **11.859:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| clt-warning-fg / card | `#AFDADF` | `#1A232C` | **10.537:1** | AAA (≥ 7,0) | 4.5:1 | PASS |
| clt-warning-solid-fg / clt-warning-solid (pílula) | `#071420` | `#B2E2E2` | **13.160:1** | AAA (≥ 7,0) | 7.0:1 | PASS |
| clt-warning-border / clt-warning-bg | `#668E93` | `#12282A` | **4.297:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| clt-warning-border / background | `#668E93` | `#101820` | **4.990:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| clt-warning-border / card | `#668E93` | `#1A232C` | **4.434:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |
| clt-warning-solid / background (ícone) | `#B2E2E2` | `#101820` | **12.671:1** | UI/borda (≥ 3,0) | 3.0:1 | PASS |

### 3.3 Daltonismo (matrizes exatas do SeeB)

Simulação com as `feColorMatrix` inspecionadas em `seeb-widget.js` (Alt+2…5):

- Protanopia: `0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0`
- Deuteranopia: `0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0`
- Tritanopia: `0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0`
- Monocromático: luminância sRGB `0.2126, 0.7152, 0.0722`

Critério: um par **colapsa** se ΔE00 < 5 (tom idêntico). Pares críticos (`paid` vs `overdue-calote`, `rework` vs `clt-warning`, `paid` vs `in-production`, `overdue-calote` vs `rework`, `awaiting-confirmation` vs `rework`) foram desenhados para ΔE00 ≥ 8 em protanopia/deuteranopia no light (todos passaram com folga; `paid` vs `overdue-calote` no light supera 17). Na **tritanopia** (rara), vermelho e ocre/terracota se aproximam por natureza do eixo azul–amarelo: o pior par light é `overdue-calote` vs `rework` (WEAK, mas ΔE00 ≈ 9, acima do colapso). No dark, três pares ficam WEAK (não colapsam), com boa separação de luminância no caso `overdue` vs `rework` (ΔY > 0,23). **Monocromático:** seis sólidos escuros o bastante para texto cream AAA não cabem em faixas de luminância todas distintas; por isso **ícone + rótulo textual são obrigatórios** em qualquer status, nos dois temas, com ou sem SeeB.

#### Light — protanopia

| Par | Métrica | Resultado |
|---|---|---|
| paid vs overdue-calote | ΔE00=17.51  ΔY=0.016 | PASS |
| rework vs clt-warning | ΔE00=43.74  ΔY=0.090 | PASS |
| paid vs in-production | ΔE00=20.68  ΔY=0.032 | PASS |
| awaiting-confirmation vs rework | ΔE00=27.89  ΔY=0.025 | PASS |
| overdue-calote vs rework | ΔE00=13.58  ΔY=0.071 | PASS |
| in-production vs clt-warning | ΔE00=10.66  ΔY=0.035 | PASS |
| awaiting-confirmation vs clt-warning | ΔE00=18.22  ΔY=0.066 | PASS |
| paid vs awaiting-confirmation | ΔE00=15.32  ΔY=0.062 | PASS |
| overdue-calote vs clt-warning | ΔE00=36.84  ΔY=0.019 | PASS |
| in-production vs rework | ΔE00=45.32  ΔY=0.055 | PASS |
| paid vs rework | ΔE00=26.37  ΔY=0.087 | PASS |
| in-production vs awaiting-confirmation | ΔE00=15.09  ΔY=0.030 | PASS |
| awaiting-confirmation vs overdue-calote | ΔE00=26.56  ΔY=0.047 | PASS |
| paid vs clt-warning | ΔE00=15.63  ΔY=0.003 | PASS |
| in-production vs overdue-calote | ΔE00=41.10  ΔY=0.016 | PASS |

#### Light — deuteranopia

| Par | Métrica | Resultado |
|---|---|---|
| paid vs overdue-calote | ΔE00=28.76  ΔY=0.032 | PASS |
| rework vs clt-warning | ΔE00=49.90  ΔY=0.111 | PASS |
| paid vs in-production | ΔE00=17.92  ΔY=0.030 | PASS |
| awaiting-confirmation vs rework | ΔE00=21.72  ΔY=0.031 | PASS |
| overdue-calote vs rework | ΔE00=12.75  ΔY=0.075 | PASS |
| in-production vs clt-warning | ΔE00=10.47  ΔY=0.033 | PASS |
| awaiting-confirmation vs clt-warning | ΔE00=25.43  ΔY=0.080 | PASS |
| paid vs awaiting-confirmation | ΔE00=18.38  ΔY=0.077 | PASS |
| overdue-calote vs clt-warning | ΔE00=44.10  ΔY=0.036 | PASS |
| in-production vs rework | ΔE00=49.24  ΔY=0.078 | PASS |
| paid vs rework | ΔE00=35.70  ΔY=0.108 | PASS |
| in-production vs awaiting-confirmation | ΔE00=20.19  ΔY=0.047 | PASS |
| awaiting-confirmation vs overdue-calote | ΔE00=21.48  ΔY=0.044 | PASS |
| paid vs clt-warning | ΔE00=13.27  ΔY=0.003 | PASS |
| in-production vs overdue-calote | ΔE00=45.82  ΔY=0.003 | PASS |

#### Light — tritanopia

| Par | Métrica | Resultado |
|---|---|---|
| paid vs overdue-calote | ΔE00=33.87  ΔY=0.001 | PASS |
| rework vs clt-warning | ΔE00=40.04  ΔY=0.021 | PASS |
| paid vs in-production | ΔE00=19.21  ΔY=0.087 | PASS |
| awaiting-confirmation vs rework | ΔE00=16.58  ΔY=0.033 | PASS |
| overdue-calote vs rework | ΔE00=9.26  ΔY=0.036 | WEAK |
| in-production vs clt-warning | ΔE00=13.07  ΔY=0.071 | PASS |
| awaiting-confirmation vs clt-warning | ΔE00=28.46  ΔY=0.053 | PASS |
| paid vs awaiting-confirmation | ΔE00=24.83  ΔY=0.069 | PASS |
| overdue-calote vs clt-warning | ΔE00=39.45  ΔY=0.015 | PASS |
| in-production vs rework | ΔE00=42.37  ΔY=0.050 | PASS |
| paid vs rework | ΔE00=35.50  ΔY=0.037 | PASS |
| in-production vs awaiting-confirmation | ΔE00=28.69  ΔY=0.017 | PASS |
| awaiting-confirmation vs overdue-calote | ΔE00=21.73  ΔY=0.068 | PASS |
| paid vs clt-warning | ΔE00=7.64  ΔY=0.016 | WEAK |
| in-production vs overdue-calote | ΔE00=44.43  ΔY=0.086 | PASS |

#### Light — monocromático

| Par | ΔY (luminância) | Resultado |
|---|---:|---|
| paid vs overdue-calote | ΔY=0.020 | PASS — ícone + rótulo obrigatório |
| rework vs clt-warning | ΔY=0.036 | PASS — ícone + rótulo obrigatório |
| paid vs in-production | ΔY=0.038 | PASS — ícone + rótulo obrigatório |
| awaiting-confirmation vs rework | ΔY=0.009 | PASS — ícone + rótulo obrigatório |
| overdue-calote vs rework | ΔY=0.055 | PASS — ícone + rótulo obrigatório |
| in-production vs clt-warning | ΔY=0.039 | PASS — ícone + rótulo obrigatório |
| awaiting-confirmation vs clt-warning | ΔY=0.027 | PASS — ícone + rótulo obrigatório |
| paid vs awaiting-confirmation | ΔY=0.025 | PASS — ícone + rótulo obrigatório |
| overdue-calote vs clt-warning | ΔY=0.018 | PASS — ícone + rótulo obrigatório |
| in-production vs rework | ΔY=0.003 | PASS — ícone + rótulo obrigatório |
| paid vs rework | ΔY=0.035 | PASS — ícone + rótulo obrigatório |
| in-production vs awaiting-confirmation | ΔY=0.012 | PASS — ícone + rótulo obrigatório |
| awaiting-confirmation vs overdue-calote | ΔY=0.046 | PASS — ícone + rótulo obrigatório |
| paid vs clt-warning | ΔY=0.002 | PASS — ícone + rótulo obrigatório |
| in-production vs overdue-calote | ΔY=0.058 | PASS — ícone + rótulo obrigatório |

#### Dark — protanopia

| Par | Métrica | Resultado |
|---|---|---|
| paid vs overdue-calote | ΔE00=17.60  ΔY=0.096 | PASS |
| rework vs clt-warning | ΔE00=31.14  ΔY=0.164 | PASS |
| paid vs in-production | ΔE00=20.31  ΔY=0.081 | PASS |
| awaiting-confirmation vs rework | ΔE00=23.46  ΔY=0.143 | PASS |
| overdue-calote vs rework | ΔE00=9.63  ΔY=0.255 | WEAK |
| in-production vs clt-warning | ΔE00=15.27  ΔY=0.268 | PASS |
| awaiting-confirmation vs clt-warning | ΔE00=6.39  ΔY=0.021 | WEAK |
| paid vs awaiting-confirmation | ΔE00=11.56  ΔY=0.208 | PASS |
| overdue-calote vs clt-warning | ΔE00=33.36  ΔY=0.091 | PASS |
| in-production vs rework | ΔE00=42.80  ΔY=0.432 | PASS |
| paid vs rework | ΔE00=20.16  ΔY=0.351 | PASS |
| in-production vs awaiting-confirmation | ΔE00=19.52  ΔY=0.289 | PASS |
| awaiting-confirmation vs overdue-calote | ΔE00=25.87  ΔY=0.112 | PASS |
| paid vs clt-warning | ΔE00=15.61  ΔY=0.187 | PASS |
| in-production vs overdue-calote | ΔE00=42.30  ΔY=0.177 | PASS |

#### Dark — deuteranopia

| Par | Métrica | Resultado |
|---|---|---|
| paid vs overdue-calote | ΔE00=28.46  ΔY=0.189 | PASS |
| rework vs clt-warning | ΔE00=36.23  ΔY=0.243 | PASS |
| paid vs in-production | ΔE00=15.93  ΔY=0.070 | PASS |
| awaiting-confirmation vs rework | ΔE00=18.58  ΔY=0.155 | PASS |
| overdue-calote vs rework | ΔE00=8.73  ΔY=0.236 | WEAK |
| in-production vs clt-warning | ΔE00=14.67  ΔY=0.252 | PASS |
| awaiting-confirmation vs clt-warning | ΔE00=14.19  ΔY=0.088 | PASS |
| paid vs awaiting-confirmation | ΔE00=13.23  ΔY=0.270 | PASS |
| overdue-calote vs clt-warning | ΔE00=38.89  ΔY=0.007 | PASS |
| in-production vs rework | ΔE00=46.41  ΔY=0.495 | PASS |
| paid vs rework | ΔE00=29.03  ΔY=0.424 | PASS |
| in-production vs awaiting-confirmation | ΔE00=24.30  ΔY=0.340 | PASS |
| awaiting-confirmation vs overdue-calote | ΔE00=21.45  ΔY=0.081 | PASS |
| paid vs clt-warning | ΔE00=13.24  ΔY=0.182 | PASS |
| in-production vs overdue-calote | ΔE00=47.46  ΔY=0.259 | PASS |

#### Dark — tritanopia

| Par | Métrica | Resultado |
|---|---|---|
| paid vs overdue-calote | ΔE00=32.36  ΔY=0.050 | PASS |
| rework vs clt-warning | ΔE00=37.95  ΔY=0.111 | PASS |
| paid vs in-production | ΔE00=8.39  ΔY=0.058 | WEAK |
| awaiting-confirmation vs rework | ΔE00=12.98  ΔY=0.048 | PASS |
| overdue-calote vs rework | ΔE00=12.80  ΔY=0.234 | PASS |
| in-production vs clt-warning | ΔE00=9.56  ΔY=0.237 | WEAK |
| awaiting-confirmation vs clt-warning | ΔE00=24.07  ΔY=0.063 | PASS |
| paid vs awaiting-confirmation | ΔE00=20.94  ΔY=0.232 | PASS |
| overdue-calote vs clt-warning | ΔE00=42.50  ΔY=0.345 | PASS |
| in-production vs rework | ΔE00=40.18  ΔY=0.127 | PASS |
| paid vs rework | ΔE00=33.27  ΔY=0.184 | PASS |
| in-production vs awaiting-confirmation | ΔE00=27.42  ΔY=0.174 | PASS |
| awaiting-confirmation vs overdue-calote | ΔE00=21.81  ΔY=0.282 | PASS |
| paid vs clt-warning | ΔE00=13.27  ΔY=0.295 | PASS |
| in-production vs overdue-calote | ΔE00=42.47  ΔY=0.108 | PASS |

#### Dark — monocromático

| Par | ΔY (luminância) | Resultado |
|---|---:|---|
| paid vs overdue-calote | ΔY=0.137 | PASS — ícone + rótulo obrigatório |
| rework vs clt-warning | ΔY=0.050 | PASS — ícone + rótulo obrigatório |
| paid vs in-production | ΔY=0.112 | PASS — ícone + rótulo obrigatório |
| awaiting-confirmation vs rework | ΔY=0.110 | PASS — ícone + rótulo obrigatório |
| overdue-calote vs rework | ΔY=0.292 | PASS — ícone + rótulo obrigatório |
| in-production vs clt-warning | ΔY=0.317 | PASS — ícone + rótulo obrigatório |
| awaiting-confirmation vs clt-warning | ΔY=0.160 | PASS — ícone + rótulo obrigatório |
| paid vs awaiting-confirmation | ΔY=0.045 | PASS — ícone + rótulo obrigatório |
| overdue-calote vs clt-warning | ΔY=0.342 | PASS — ícone + rótulo obrigatório |
| in-production vs rework | ΔY=0.267 | PASS — ícone + rótulo obrigatório |
| paid vs rework | ΔY=0.155 | PASS — ícone + rótulo obrigatório |
| in-production vs awaiting-confirmation | ΔY=0.157 | PASS — ícone + rótulo obrigatório |
| awaiting-confirmation vs overdue-calote | ΔY=0.182 | PASS — ícone + rótulo obrigatório |
| paid vs clt-warning | ΔY=0.205 | PASS — ícone + rótulo obrigatório |
| in-production vs overdue-calote | ΔY=0.025 | PASS — ícone + rótulo obrigatório |

---

## 4. Compatibilidade técnica com o widget SeeB

Inspeção direta de `/workspace/taller-saas/seeb-widget.js` (54.080 bytes, 1 linha minificada, 13/11/2026). Esta seção alinha-se à estratégia já descrita no doc 02, seção 5, e acrescenta implicações **de CSS/tokens** medidas no código.

### 4.1 O que o widget realmente faz

- Web Component `<seeb-widget>` com **Shadow DOM aberto**. Botão flutuante arrastável (`#a11y-icon`, **55×55px**) e painel **`#a11y-panel` com 340px** de largura (em `max-width: 600px`, o painel vira `100vw`).
- Posição padrão: **`right-center`** (`top: 50%; right: 20px; transform: translateY(-50%)`). Presets: `top-left|top-center|top-right|left-center|right-center|bottom-left|bottom-center|bottom-right` ou `custom` (arraste). Não há `data-*` de configuração para o integrador: posição e cores ficam em `localStorage["seeb.settings"]`.
- Cores padrão do próprio widget: ícone **`#003667`**, painel **`#E6EDF3`** (também `--cor-destaque: #014C83`, `--cor-neutra-escura: #1A4975`, foco interno `#315A81`). São do chrome do SeeB, não da nossa paleta — não redefinir.
- `z-index`: `:host` **2147483647**; `#a11y-container` **1000001**; `#a11y-panel` **1000000**; guia de leitura `#a11y-reading-guide` **999998** (este último vive no `document`, fora do shadow). A aplicação não deve passar de `--z-max-app: 9990`.
- `wrapContent()` roda **uma vez** na inicialização (sem `MutationObserver`): cria `#seeb-content-wrapper` e move `#__next` **ou** `#__nuxt` **ou** `#app` **ou** raiz Angular; se nenhum existir, move os filhos do `body` (exceto `SCRIPT`/`STYLE`/`LINK`, o próprio widget, `#seeb-svg-filters` e `#a11y-reading-guide`). No App Router **não existe `#__next`** — daí o `<div id="app">` obrigatório (já especificado no doc 02).
- Folha global `#seeb-global-styles` e filtros SVG `#seeb-svg-filters` (protanopia, deuteranopia, tritanopia, monochromatic).

### 4.2 Filtros, classes e atalhos (fato do código)

`applyFilters()` escreve `style.filter` no `#seeb-content-wrapper`:

| Recurso | Atalho | Efeito real no CSS |
|---|---|---|
| Alto contraste | Alt+C | `contrast(1.5) saturate(1.5)` |
| Inverter cores | Alt+I | `invert(1)` + classe `seeb-reinvert-media` em `<html>` (imagens/vídeo/iframe voltam a `invert(1) hue-rotate(180deg)`) |
| “Modo escuro” do SeeB | Alt+D | `invert(0.9) hue-rotate(180deg)` + `seeb-reinvert-media`. **Mutuamente exclusivo com invert.** **Não adiciona `.dark`.** |
| Daltonismo | Alt+1…5 | `url("#protanopia-filter")` etc. |
| Brilho / saturação | sliders | `brightness()` / `saturate()` |
| Ampliar texto | Alt+T | `html { font-size: 125% !important }` (de 100%). Por isso a escala do app é em **rem**. |
| Fonte Atkinson | — | **`applySettings()` sempre adiciona `seeb-font-active` no `<html>`**, o que faz `html, html body { font-family: 'Atkinson Hyperlegible' !important }`. Não é um toggle de “modo leitura”: ao carregar o widget, o corpo herda Atkinson (400/700, original, não a Next). Elementos com `font-family` próprio (`font-display`, `font-mono`, um wrapper `#app.font-sans`) **não** são atingidos, porque o seletor não é `*`. |
| Espaçamento | Alt+E | `letter-spacing: 0.12em; line-height: 1.8; word-spacing: 2px` em p/li/a/span |
| Negrito | Alt+B | `font-weight: 700 !important` em tudo no wrapper |
| Sublinhar / destacar links | Alt+U / Alt+K | underline 2px; highlight com `outline: 2px solid #0066cc` + fundo azul 12% |
| Realçar foco | Alt+J | `outline: 3px solid #FF6B00; outline-offset: 3px; box-shadow: 0 0 0 6px rgba(255,107,0,.25)` em `:focus` e `:focus-visible` |
| Parar animações | Alt+P | `animation-play-state: paused; transition-duration: 0ms` |
| Reduzir transparência | — | `#seeb-content-wrapper * { opacity: 1 !important; backdrop-filter: none !important; }` |
| Ocultar imagens / fundos | Alt+H | `visibility: hidden` em img/video/picture; `background-image: none` |
| Guia / linha de foco | Alt+G / Alt+F | régua `#a11y-reading-guide` (z-index 999998, cor padrão `rgba(108,97,136,0.3)`); linha de foco pinta `background-color` inline `#AED5F2` |
| Voz | Alt+V | `SpeechSynthesisUtterance.lang = document.documentElement.lang || "pt-BR"`. **Porém** `getVoiceByGender()` prefere vozes com `lang.startsWith("pt")` antes de cair nas demais. Com `<html lang="es">` a *utterance* pede espanhol, mas a voz escolhida pode continuar sendo portuguesa. Documentar na página de acessibilidade (doc 02) e, se o Rafael autorizar, corrigir upstream no repositório do widget. |
| Redefinir | Alt+R | limpa classes e `localStorage["seeb.settings"]`, mas `applySettings` reaplica `seeb-font-active`. |

Painel do widget: **somente PT-BR**, sem i18n. Mitigações já listadas no doc 02 (página “Accesibilidad”, tooltip, eventual upstream).

### 4.3 Regras práticas no CSS e no layout Next.js 16 + shadcn/ui

1. **Envolver o app em `<div id="app">`** e expor `<div id="portal-root">` dentro dele. Carregar o script com `next/script` e `strategy="lazyOnload"` (depois da hidratação). Detalhes e CSP: doc 02, seções 5.3 e 5.4.
2. **Portais do Radix/shadcn** (Dialog, Sheet, Popover, Select, Dropdown, Sonner) devem usar `container={ document.getElementById('portal-root') }`. Se nascerem no `body` depois do `wrapContent()`, **ficam fora do wrapper**: não recebem filtros de daltonismo/contraste/inversão e o leitor de voz não os lê.
3. **Fundos opacos.** Proibido `backdrop-filter` em qualquer superfície que precise contrastar (o SeeB zera o efeito; e “reduzir transparência” ainda força `opacity: 1` em *todos* os descendentes). Overlays de modal usam a utility `.overlay-scrim` (alfa no `background-color`, não na propriedade `opacity`). Estados desabilitados e esconder conteúdo: cor tokenizada, `visibility` ou `hidden`/`inert` — nunca `opacity: 0` como único mecanismo (o filtro do SeeB revelaria o que deveria estar invisível).
4. **Não sincronizar Alt+D com `.dark`.** São mecanismos diferentes; os dois ao mesmo tempo inverteriam um tema já escuro. O tema nativo `.dark` é o caminho certo para uso noturno. Os tokens light, com contraste AAA, também sobrevivem melhor a um invert acidental.
5. **Croma moderado de propósito.** `contrast(1.5) saturate(1.5)` do Alt+C estoura cores já neon — por isso os sólidos ficam abaixo do croma máximo do gamut.
6. **Rem e nunca `px` na tipografia.** Alt+T só amplia quem está em rem. Inputs ≥ `1rem`.
7. **Respiro do FAB:** `--seeb-safe-right: 87px` (20 + 55 + 12) em CTAs fixos à direita / barras inferiores. Em viewports ≤ 600px o painel ocupa a tela inteira quando aberto.
8. **Atalhos:** o app não usa Alt+letra (colide com o SeeB).
9. **O SeeB é overlay, não substitui WCAG/eMAG nativos** (`jsx-a11y`, axe-core/Playwright, ASES), como já está no doc 02, seção 5.6.

---

## 5. Tipografia técnica (`next/font/google`)

Verificação em **13/11/2026, horário de Brasília (UTC-3)**, via API CSS do Google Fonts (User-Agent Chrome, subsets `latin` e `latin-ext`) e inspeção OpenType dos TTF servidos (fontTools): cmap (glifos) e GSUB (`tnum`).

### 5.1 Famílias escolhidas

| Papel | Família | Identificador `next/font/google` | latin / latin-ext | `ñ ¿ ¡` e acentos PT/ES / `R$` | Tabular nums | Pesos |
|---|---|---|---|---|---|---|
| `--font-sans` (corpo, UI) | **Atkinson Hyperlegible Next** | `Atkinson_Hyperlegible_Next` | Sim / sim (v7) | Todos presentes no TTF inspecionado | Feature `tnum` **presente e eficaz** (dígitos `.tf` com largura 632). Padrão é *proporcional* — **obrigatório** usar `.tabular-money`. Sem tag `lnum` (os lining já são o padrão). | Variável 200–800, itálico incluso. Carregar 400–700. |
| `--font-display` (títulos, marca, cabeçalho do recibo) | **IBM Plex Sans** | `IBM_Plex_Sans` | Sim / sim (v23) | Todos presentes | No TTF do Google Fonts, os dígitos **já nascem tabulares** (largura 600). As tags `tnum`/`lnum` **não estão** nesse arquivo; `font-variant-numeric: tabular-nums` é inócuo e deve ser aplicado assim mesmo. | 400, 500, 600, 700 + itálico 400. |
| `--font-mono` (ref. de lote, chave Pix, hash, token) | **IBM Plex Mono** | `IBM_Plex_Mono` | Sim / sim (v23) | Todos presentes | Monoespaçada (600). `tnum` desnecessário. | 400, 500, 600 + itálico 400. |

Candidatas conferidas e **não usadas no app** (todas existem hoje no Google Fonts, com latin-ext e os glifos PT/ES): Plus Jakarta Sans (`tnum` real, padrão proporcional), Instrument Sans (idem), Bricolage Grotesque (idem; personalidade demais para o chão de fábrica), JetBrains Mono (boa, mas “dev”; Plex Mono casa com o display), Source Sans 3 (dígitos tabulares por padrão, sem tag `tnum`; mais “neutra de formulário”), Atkinson Hyperlegible *original* (400/700, `tnum` real, largura 639) — reservada ao SeeB.

**Por que Atkinson Hyperlegible Next no corpo:** foi desenhada para leitura cansada; tem mais pesos que a original; e, quando o SeeB carrega, o `body` passa à original (400/700), que é a irmã mais próxima — o salto visual é pequeno. Títulos em IBM Plex Sans (`font-display` no elemento) **sobrevivem** ao `seeb-font-active`, que não usa seletor universal.

### 5.2 Configuração exata

```ts
// src/styles/fonts.ts
import {
  Atkinson_Hyperlegible_Next,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
} from "next/font/google";

export const fontSans = Atkinson_Hyperlegible_Next({
  subsets: ["latin", "latin-ext"],
  weight: "400 700", // variável
  style: ["normal", "italic"],
  variable: "--font-sans",
  display: "swap",
});

export const fontDisplay = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const fontMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-mono",
  display: "swap",
});
```

No `app/[locale]/layout.tsx`: `className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}` no `<html>` (além de `lang={locale}` e `suppressHydrationWarning`). A classe `font-sans` pode ir também em `#app`, para o corpo permanecer Next mesmo se se quiser isolar o override do SeeB no `body` — decisão de implementação: o padrão recomendado é **aceitar** o Atkinson original no corpo quando o widget está ativo (acessibilidade) e **preservar Plex** em títulos, recibo e mono.

CSP: `font-src` deve incluir `https://fonts.gstatic.com` enquanto o SeeB importar a original via Google Fonts (doc 02, 5.4). O `next/font` auto-hospeda as nossas três famílias.

### 5.3 Escala mobile-first

| Papel | Tamanho | Entrelinha | Peso | Família |
|---|---|---|---|---|
| Corpo | `1rem` (16px) no mobile; `1.125rem` (18px) a partir de 640px | 1,5 | 400 | sans |
| Texto auxiliar | `0.875rem` (14px) **só em desktop**; no mobile não descer de 16px em leituras longas | 1,45 | 400 | sans |
| Input / textarea / select | **mínimo `1rem` (16px)** em qualquer breakpoint | 1,4 | 400 | sans |
| Valores em R$ e peças | `1.125–1.5rem`, sempre `.tabular-money` | 1,2 | 600 | sans |
| Rótulo de status | `0.875–1rem` + ícone | 1,3 | 600 | sans |
| `h1` (recibo, marca) | `1.5–1.75rem` | 1,25 | 600 | display |
| `h2` / título de tela | `1.25–1.5rem` | 1,3 | 600 | display |
| Código / Pix / token | `0.875–1rem` | 1,4 | 400–500 | mono |

Utility obrigatória em qualquer valor monetário ou quantidade de peças:

```html
<span class="tabular-money">R$ 900,00</span>
<!-- ES/PT no mesmo componente, lang no elemento quando misturar -->
```

---

## 6. Tokens de layout, espaçamento, raios, bordas, toque e foco

### 6.1 Grid mobile-first

- Largura de referência: **360px** (Android intermediário). Conteúdo com `--spacing` do Tailwind (base 4px) e padding horizontal de `1rem`, crescendo para `1.5rem` acima de 640px.
- Largura máxima de leitura (recibo, termos): `40rem`.
- Bottom nav das 4 abas do doc 02 (`Hoy`, produção, `Cobros`, `Cuenta`): altura ≥ 56px + `env(safe-area-inset-bottom)`, com `--seeb-safe-right` se houver FAB próprio à direita. Não competir com o FAB do SeeB no eixo vertical central direito.
- Uma coluna no mobile. Dois cartões lado a lado só a partir de 768px.

### 6.2 Raios, bordas e elevação

| Token | Valor | Uso |
|---|---|---|
| `--radius` / `--radius-lg` | `0.5rem` (8px) | Cards, dialogs, inputs — canto de ficha, não pílula. |
| `--radius-sm` | `0.25rem` | Chips densos, thumbs. |
| `--radius-md` | `0.375rem` | Botões secundários, badges. |
| `--radius-xl` | `0.75rem` | Folhas grandes (sheet). |
| Borda de card | `1px solid var(--border)` | Hierarquia principal. Sem sombra pesada. |
| Borda de input | `1.5px solid var(--input)` | Mais presente que o card, ≥ 3:1. |
| `--shadow-card` | `0 1px 0 oklch(… / 0.06)` | Residual, quase um filete. |

Badges de status podem usar `rounded-full` *somente* na pílula, nunca no card inteiro.

### 6.3 Alvos de toque

- Mínimo **48×48px** (`--touch-target-min: 3rem`). Ações primárias, **56px** (`--touch-target-comfort`).
- Zona de segurança entre ações **opostas** (ex.: “Confirmo o recebimento” vs “Recebi com divergência”, ou “Registrar pago” vs “Dar por perdido”): **no mínimo 12px** de gap, preferencialmente em pilha vertical no mobile, nunca lado a lado coladas.
- O microfone do apontamento por voz: 56px, `aria-pressed`, status falado (“Escuchando… / Ouvindo…”).

### 6.4 Foco visível

Já em `@layer base` de `tokens.css`: anel de 3px `var(--ring)` + anel externo da cor de `--background` (anel duplo). Sobrevive a `invert` e a `contrast(1.5)`. Não remover o outline sem `:focus-visible`. Com Alt+J, o SeeB acrescenta o laranja `#FF6B00` com `!important`.

### 6.5 `prefers-reduced-motion`

Respeitado no `@layer base`. O SeeB (Alt+P) ainda pausa animações com `!important` dentro do wrapper — não lutar contra isso.

---

## 7. Briefing técnico de logo e assets (para o Claude Code — não gerar os arquivos agora)

### 7.1 Conceito simbólico

Marca **funcional e digna**, no mesmo espírito da paleta: um **ponto de costura reto** + o **canto dobrado de uma ficha/caderno**, ou um laço mínimo de linha atravessando um canto de cartão. Traço único, geométrico, sem folclore, sem máquina industrial realista, sem agulha “desenho infantil”, sem degradê.

A marca precisa funcionar:

- bordada em 16px (favicon) e em 20px no header mobile;
- em uma cor (`currentColor`) sobre papel, sobre índigo, e sobre o ícone PWA;
- ao lado do wordmark “Puntada” / “Constancia” / “Bitácora” / `TallerApp` (o nome que o Rafael escolher), em IBM Plex Sans 600.

### 7.2 Grid e `viewBox`

- Símbolo (`logo-mark`): `viewBox="0 0 32 32"`, grade de 2×2 (unidades inteiras). Traço `stroke-width="2"` (ou 1,75 se o teste em 16px pedir), `stroke-linecap="round"`, `stroke-linejoin="round"`, `fill="none"` no traço principal. Áreas sólidas só se forem necessárias ao cantão da ficha, alinhadas à grade.
- Logo horizontal (símbolo + wordmark): `viewBox="0 0 160 32"` (ou 48 de altura se o wordmark pedir), mesma espessura proporcional.
- Versão compacta 48×48 para o briefing de app icon, ainda em vetor: `viewBox="0 0 48 48"`, grade de 4×4, a marca centrada na safe zone (ver 7.5).

### 7.3 Versões de arquivo (o Claude gera depois)

| Arquivo | Regra |
|---|---|
| `brand/logo-mono.svg` | `currentColor`, **sem** `width`/`height` fixos, **sem** `<style>` interno, sem IDs duplicados. SVGO. `role="img"` + `<title>` (ou `aria-hidden="true"` se for decorativo ao lado de um texto visível). |
| `brand/logo.svg` | Colorido, **somente** tokens da paleta: índigo `--primary` (`#1C4066` no light) e, se houver um segundo traço, terracota `--accent-foreground` (`#4F2611`) ou creme `#FEFCF8`. Nunca hex solto que não exista em `tokens.css`. |
| `brand/logo-mark.svg` | Só o símbolo, mesmas regras de cor. |
| `app/icon.svg` | Favicon vetorial, `viewBox="0 0 32 32"`, fundo **opaco** `--primary` e marca em `--primary-foreground`. |

### 7.4 Clear space e fundos

- Clear space mínimo: **a altura do traço × 2** (ou ¼ da altura do símbolo, o que for maior) em todos os lados.
- Tamanho mínimo: **16px** favicon, **20px** símbolo no header mobile, **24px** se houver wordmark pequeno.
- Fundos permitidos: `--background`, `--card`, `--primary`, `--foreground` (neste caso a marca vira creme). Proibido sobre foto saturada, degradê e sobre `--muted` de baixo contraste sem uma plaquinha opaca.

### 7.5 Ícones PWA e Apple

Gerar depois com `scripts/generate-icons.ts` (sharp), a partir do SVG:

| Arquivo | Tamanho | Regra |
|---|---|---|
| `icon-192.png` | 192×192 | Fundo opaco `--primary`, marca creme centrada. |
| `icon-512.png` | 512×512 | Idem. |
| `icon-512-maskable.png` | 512×512 | **Safe zone central de 80%** = 409×409 px (margem de 10% em cada lado). A marca inteira cabe num círculo de raio 204px no centro, para não ser cortada nos cantos arredondados do Android. Fundo opaco `--primary`. `purpose: "maskable"` no `manifest.ts`. |
| `apple-icon.png` / `app/apple-icon.png` | 180×180 | Fundo **sólido opaco** (sem transparência — o iOS não usa o manifest). |
| `app/icon.svg` + `favicon.ico` | 32 e fallback | Ver 7.3. |

`app/manifest.ts`: `name` (nome comercial), `short_name` ≤ 12, `start_url: "/?source=pwa"`, `display: "standalone"`, `background_color: "#FAF6EE"`, `theme_color: "#1C4066"`, `lang` por locale, ícones 192, 512 e 512 maskable, atalhos “Nuevo lote / Novo lote” e “Cobrar”.

### 7.6 Open Graph / Twitter 1200×630

`app/[locale]/opengraph-image.tsx` e `twitter-image.tsx` via `next/og` `ImageResponse`. Um por idioma (`es`, `pt-BR`).

- Carregar **IBM Plex Sans** (600/400) como `ArrayBuffer` (ficheiro em `public/fonts` ou fetch do `next/font` no runtime de edge — seguir o padrão oficial do `next/og`).
- Fundo opaco `--background` (`#FAF6EE`), faixa ou canto índigo `--primary`, wordmark + símbolo, tipografia grande, **contraste AAA**.
- Copy curta real, no singular, **sem citar concorrentes**:
  - **pt-BR:** “O caderno do seu taller. Registre, comprove e cobre.” + “R$ 35/mês”
  - **es:** “El cuaderno de su taller. Registre, compruebe y cobre.” + “R$ 35/mês”
- Sem fotos de pessoas reais, sem dados de oficinas reais, sem QR de Pix verdadeiro. Dados fictícios (“Taller Rosa”, “R$ 900,00”, “300 piezas”) se houver mock de tela.

### 7.7 Governança do Impeccable (Paul Bakaus)

Instalação já mapeada no doc de pesquisa: `npx impeccable install --providers=claude --scope=project`, depois **`/impeccable init` uma vez**. Comandos: `/impeccable audit`, `/impeccable polish`, `/impeccable critique` (e equivalentes `bolder`, etc.).

Regras que o hook e os comandos **devem respeitar** neste projeto (gravar em `.impeccable` / vocabulario do init):

1. **Só tokens de `tokens.css`.** Proibido hex hardcoded em componente, salvo o briefing de OG/ícone que já usa os HEX *validados* desta paleta. Sem `bg-[#…]`, sem `text-blue-600` do Tailwind default, sem paleta shadcn “zinc/violet” residual.
2. **Sem AI slop:** sem degradê roxo/neon, sem `backdrop-filter` em superfície crítica, sem sombra teatral, sem raio > `--radius-xl` em card, sem ilustração 3D genérica, sem folclore caricato.
3. **Toque ≥ 48×48px**, gap ≥ 12px entre ações opostas.
4. **`tabular-nums`** em todo valor em R$ e em toda contagem de peças (classe `.tabular-money`).
5. **Bordas nítidas de 1px/1,5px**, hierarquia por borda — não por sombra.
6. **Contraste:** não clarear `--muted-foreground` abaixo de AA; não usar muted em dinheiro; não trocar pares já medidos nesta matriz.
7. **SeeB:** fundos opacos; sem `opacity` como único meio de esconder; portais dentro de `#app` / `#portal-root`; sem `z-index` > 9990; tipografia em rem; respeitar `prefers-reduced-motion`.
8. **Bilinguismo e singular:** copy nova em `es` e `pt-BR`, tratando o usuário no singular; `lang` correto em trechos mistos.
9. **Auditoria:** `/impeccable audit` nas telas `hoy`, produção/acerto, `cobros`, `cuenta` e no link público `/c/[token]`, nos dois temas e nos dois idiomas, antes do polish final.

---

## 8. Checklist de entrega para o Claude Code

- [ ] Copiar `tokens.css` para `src/styles/tokens.css` e importar no `globals.css` depois de `@import "tailwindcss"`.
- [ ] Ligar `fonts.ts` (seção 5.2) no `app/[locale]/layout.tsx`, com `<div id="app">` e `<div id="portal-root">`.
- [ ] Centralizar o nome em `src/config/brand.ts` (placeholder `TallerApp` até o A1).
- [ ] Gerar logo e ícones **depois** (seção 7), a partir destes tokens — não antes.
- [ ] Rodar `/impeccable init` e gravar as regras da seção 7.7.
- [ ] Conferir com Playwright + axe os pares desta matriz, o foco visível e o SeeB (modais dentro do wrapper, troca `/es` ↔ `/pt-BR`, Alt+C/I/D).

*Documento interno de planejamento. Sem dados pessoais reais. Sem nomes de concorrentes.*
