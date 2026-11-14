# Pesquisa e Contexto para o Claude Code
## Caderno Digital del Taller — Registra, Comprueba y Cobra / Registra, Comprova e Cobra

> **Arquivo único de contexto e pesquisa** para construir o MVP. Anexe este arquivo junto com o Prompt do Claude Code (`PROMPT-CLAUDE-CODE.md`), a identidade visual (`identidade-visual.md`) e os tokens (`tokens.css`), que ficam na mesma pasta, ou copie para `docs/` no repositório.
>
> Pesquisa e planejamento feitos em **13/11/2026** (horário de Brasília, UTC-3), a partir de WebSearch, WebFetch, npm registry, curl e inspeção do `widget.js` do SeeB. Fontes originais: `pesquisa-base.md`, `01-planejamento-produto-e-negocio.md`, `02-arquitetura-fluxos-e-ux.md` e `03-briefing-inputs-rafael.md`. Identidade visual técnica e paleta (item D1, **concluído em 13/11/2026**): `identidade-visual.md` + `tokens.css`, resumidos na seção 8.
>
> **Regras de uso deste arquivo**
> - Não invente URL, versão, taxa, artigo de lei ou dado que não esteja aqui. O que não foi encontrado ou não foi conferido no original está marcado com ⚠️ ou listado na seção 1.12.
> - Hipóteses aparecem explicitamente como **hipótese a validar**. Não as trate como fato.
> - Este documento é um mapa de produto e engenharia, **não um parecer jurídico nem contábil**. Confirme cada artigo com `leis-mcp` (`ler_artigo`) e cite a `fonte` antes de escrever termos, política ou microcopy legal. Revise com advogado e contador antes do go-live.
> - **Não cite nomes de softwares, ERPs ou concorrentes** em landing, app, termos, posts, pitch ou qualquer material público. Descreva apenas as lacunas objetivas do mercado (interface só em português, foco na marca/confecção, preço, offline, prova de entrega).
> - Nada é publicado nem enviado a cliente, parceiro ou oficina sem aprovação do Rafael. Dados reais de pessoas não entram em print, post ou documento externo.
> - Toda UI e documento visível ao usuário sai em **espanhol (`es`) e português do Brasil (`pt-BR`)**. Em PT-BR, fale com o aluno/usuário no singular ("você"). Em ES, o padrão recomendado é **"usted"** (validar nas entrevistas: "usted" vs "tú").

---

## Sumário

1. [Contexto de Produto e Mercado Verificado](#1-contexto-de-produto-e-mercado-verificado)
2. [Arquitetura e Stack (versões exatas, 11/2026)](#2-arquitetura-e-stack-versões-exatas-112026)
3. [Fluxos End-to-End, Telas, os 5 Estados e Microcopy Real (ES / PT-BR)](#3-fluxos-end-to-end-telas-os-5-estados-e-microcopy-real-es--pt-br)
4. [Schema de Banco de Dados Completo e Regras de Negócio/Integridade](#4-schema-de-banco-de-dados-completo-e-regras-de-negóciointegridade)
5. [Compliance Legal Brasil (L1–L19)](#5-compliance-legal-brasil-l1l19)
6. [Integração Técnica Obrigatória do SeeB + CSP + Acessibilidade Nativa](#6-integração-técnica-obrigatória-do-seeb--csp--acessibilidade-nativa)
7. [Briefing de Decisões e Variáveis de Ambiente](#7-briefing-de-decisões-e-variáveis-de-ambiente)
8. [Identidade Visual Técnica e Paleta (Entrega do Usopp)](#8-identidade-visual-técnica-e-paleta-entrega-do-usopp) ✅ D1 concluído em 13/11/2026

---

## 1. Contexto de Produto e Mercado Verificado

### 1.1 Nome de trabalho e promessa

**"Caderno Digital del Taller": Registra, Comprueba y Cobra / Registra, Comprova e Cobra.**

O nome comercial final ainda depende da decisão A1 (seção 7). Placeholder no código: `TallerApp`, centralizado em `src/config/brand.ts`.

**Promessa em uma frase:**

- ES: *"Anota cada corte en 20 segundos, comprueba cada entrega y cobra lo que te deben, desde el celular."*
- PT-BR: *"Anote cada corte em 20 segundos, comprove cada entrega e cobre o que te devem, direto do celular."*

### 1.2 Como funciona o fluxo real (corte → taller)

Cadeia de subcontratação verificada em fontes acadêmicas e jornalísticas: **marca/loja → confecção ou intermediário ("corte") → oficina/taller** (muitas vezes familiar, na própria casa). O intermediário entrega **moldes e tecido já cortados**; a oficina costura e devolve, e a peça recebe a etiqueta da marca, que muitas vezes é a contratante real e às vezes exige exclusividade. Por causa dessa estrutura, **muitas costureiras não sabem para quem produzem e não têm a quem cobrar quando o intermediário não paga**.

- ABET, *Trabalho, migração e reprodução social na costura: trabalhadoras bolivianas em São Paulo* (2024): https://doi.org/10.61999/abet.1676-4439.2024v23n2.69596

**Geografia:** começou no Brás, Bom Retiro e Pari (centro de SP), perto da venda (Feirinha da Madrugada). Muitas oficinas foram para a periferia (Zona Norte/Leste, Guarulhos etc.).

- TOPVIEW, *As mãos que fazem a moda*: https://topview.com.br/fashion/moda/as-maos-que-fazem-a-moda/
- UNESP/REDD, Beatriz Isola Coutinho, *Imigração laboral e o setor têxtil-vestuário de SP*: https://periodicos.fclar.unesp.br/redd/en/article/download/5040/4178/12226

**Pagamento por peça** é o padrão, com valores baixos e voláteis:

- De R$ 0,80 a R$ 5 por peça; uma família de 3 pessoas fazia cerca de 300 peças por mês e cada uma ganhava cerca de R$ 1 mil (TOPVIEW, link acima).
- De R$ 0,15 a R$ 0,50 por peça, com jornadas de até 16h, em estudos mais antigos (UNESP, link acima).
- Oficina própria em casa recebendo cerca de R$ 15 por roupa, "o triplo da média", depois de cursos de gestão (Folha, 2015): https://www1.folha.uol.com.br/mercado/2015/05/1632506-bolivianos-buscam-cursos-para-tornar-suas-oficinas-de-costura-lucrativas.shtml

**Tamanho da comunidade:** o Consulado da Bolívia estima **cerca de 350 mil bolivianos na cidade de SP**. O IBGE registra 11.566 bolivianos que chegaram à capital entre 2017 e 2022, e os bolivianos são o maior grupo de imigrantes recentes. (Folha, 27/06/2025: https://www1.folha.uol.com.br/cotidiano/2025/06/bolivianos-sao-maior-grupo-de-imigrantes-recentes-de-sp-que-recebeu-52-mil-estrangeiros-em-5-anos.shtml). ⚠️ A estimativa de 350 mil veio do resumo da busca; a matéria inteira não foi aberta na sessão de pesquisa.

**Risco reputacional e legal real:** os resgates continuam acontecendo, por exemplo "MTE resgata 36 bolivianos em situação análoga à escravidão" (G1, 21/10/2025): https://g1.globo.com/trabalho-e-carreira/noticia/2025/10/21/mte-resgata-trabalhadores-em-situacao-analoga-a-escravidao.ghtml. Um caso de indenização a bolivianos resgatados em oficina (DPU): https://direitoshumanos.dpu.def.br/apos-tres-anos-bolivianos-resgatados-em-oficina-de-costura-em-sp-obtem-indenizacao/

### 1.3 Vocabulário que o sistema precisa entender nas duas línguas

| PT-BR | ES (uso comum da comunidade) | O que o sistema registra |
|---|---|---|
| Corte / lote / pacote | corte / lote / paquete | Recebimento: data, contratante, modelo/referência, grade (P/M/G/GG), cor, quantidade, preço por peça combinado, prazo |
| Aviamentos | avíos | Linha, elástico, botão, zíper: quem fornece, quantidade recebida e quanto faltou |
| Máquinas | máquinas: recta, overlock, collareta (galoneira), interlock | Qual operação passa por qual máquina; meta por máquina por dia |
| Produção por pessoa | producción por persona | Peças por operação, por costureiro/costureira, por dia |
| Vale / adiantamento | adelanto / vale | Adiantamentos a cada trabalhador, descontados no acerto |
| Acerto semanal/quinzenal | pago semanal/quincenal | Total produzido × valor da operação − adelantos = a pagar |
| Conferência / entrega | entrega / conteo | Quantidade entregue, foto, assinatura/"ok" do contratante |
| Defeito / conserto / repasse | falla / arreglo / reproceso | Peças devolvidas para retrabalho (sem pagamento extra ou com desconto) |
| Recebimento do corte | cobro | O que o contratante deve, o que foi pago e o que está atrasado |

⚠️ "Recta", "overlock", "collareta" e "interlock" são os termos usuais em espanhol para máquinas de costura industrial. Não há fonte acadêmica que valide o jargão específico da comunidade boliviana de SP. **Validar em entrevistas** (teste de 48h; item D3).

**Os dois lados do dinheiro que a oficina precisa enxergar:**

1. **A receber do contratante:** peças entregues × preço por peça, menos descontos por defeito.
2. **A pagar à equipe:** produção × valor da operação, menos adelantos.
3. A margem da oficina é a diferença entre os dois, menos aluguel, luz, linha e manutenção.

### 1.4 Por que o caderno digital anti-calote vende por R$ 35/mês

O dono do taller é **o elo mais fraco e o que leva o calote**. Hoje ele controla tudo com **caderno, áudio de WhatsApp e calculadora**.

A tese tem três partes:

1. **Recorte estreito:** não é ERP de confecção. Faz só 3 coisas: **registrar** (lote recebido, produção, adelantos), **comprovar** (entrega com confirmação do contratante) e **cobrar** (quem me deve, há quantos dias, Pix em 1 clique).
2. **Feito para o lado fraco:** bilíngue ES/PT-BR de verdade, celular Android primeiro, funciona com sinal fraco ou sem sinal, aceita CPF ou RNM/CRNM e **não exige CNPJ** para começar.
3. **O valor aparece no primeiro uso:** o primeiro link de prova de entrega enviado pelo WhatsApp já é o "momento aha". Um lote de 300 peças a R$ 3 vale R$ 900 (exemplo aritmético). **Evitar um único calote paga mais de dois anos de assinatura** a R$ 35/mês (R$ 900 ÷ 35 ≈ **25,7 meses**).

| Hoje (caderno + WhatsApp) | Com o produto |
|---|---|
| "Te mandei áudio dizendo que entreguei 300" (sem prova) | Link com fotos, grade, valor, data e hora e o **"Confirmo recebimento"** do contratante, com IP e horário registrados |
| Conta de cabeça ou na calculadora no sábado, com briga sobre o adelanto | Recibo bilíngue por pessoa: produção − adelantos = valor a pagar, enviado no WhatsApp do costureiro |
| Aceita qualquer preço por peça porque "precisa do trabalho" | Calculadora mostra em 10 s se o corte **dá lucro ou prejuízo** e quantas peças por hora são precisas para empatar |
| Não sabe quanto tem a receber | Painel "Quem me deve e há quantos dias" + lembrete no WhatsApp com Pix |
| Medo de "registrar" | Posicionamento de **proteção e formalização**: o registro protege o taller do calote e documenta a autonomia dele |

**Mensagem central (sem tom de "controle"):** *"Protege tu taller del calote" / "Proteja seu taller do calote"*. Não competimos em PCP ou ERP: competimos com o **caderno**.

### 1.5 Lacunas objetivas do mercado atual

Os softwares tradicionais de confecção/facção no Brasil, com preços públicos encontrados em 13/11/2026, apresentam estas lacunas objetivas (por isso o taller continua no caderno, no WhatsApp, no áudio e na calculadora):

1. **Idioma:** nenhum dos produtos encontrados tem interface em espanhol.
2. **Pensados para a marca ou a confecção**, não para o dono do taller (que é o lado mais fraco e o que leva calote).
3. **Preço e complexidade:** os preços públicos encontrados vão de **R$ 59,99/mês** (dado de resumo de busca, **não conferido na página do produto**) a **R$ 649+/mês**, em geral com cadastro de ficha técnica, OP e CNPJ. Um software de facção com preço **conferido na própria página** cobra **R$ 97/mês**. R$ 35 fica abaixo de todos os preços públicos encontrados.
4. **Celular primeiro e conexão fraca:** o próprio líder de nicho de facção admite que **não funciona offline**.
5. **Prova e cobrança:** nenhum dos produtos encontrados foca em **comprovante de entrega e cobrança** para o taller se proteger do intermediário que não paga. Há, no máximo, "link para a marca" com foco diferente (controlar o taller, não protegê-lo).

| Necessidade do taller | Softwares tradicionais de confecção/facção | Caderno + WhatsApp | **Este MVP** |
|---|---|---|---|
| Interface em espanhol | Não (nenhuma encontrada) | Sim | Sim — ES + PT-BR, troca com 1 toque |
| Feito para o dono do taller (lado fraco) | Não — feitas para a marca/confecção | Sim | Sim |
| Preço ≤ R$ 35/mês | Não (de R$ 59,99 a R$ 649+) | Sim, grátis | Sim — R$ 35 |
| Começa sem CNPJ, ficha técnica nem OP | Não — exigem cadastro complexo | Sim | Sim — CPF ou RNM/CRNM |
| Funciona offline / sinal fraco | Não — o líder de nicho admite que não | Sim | Sim — fila offline + sync |
| Prova de entrega com confirmação do contratante | Parcial, com foco diferente | Não — só áudio | Sim — link público com aceite, IP e horário |
| Cobrança "quem me deve e há quantos dias" + Pix | Não encontrado | Não | Sim |
| Acerto por pessoa − adelantos | Alguns fazem acerto por peça | Manual | Sim + recibo bilíngue no WhatsApp |
| Alerta CLT art. 78 (piso por peça) | Citado em pelo menos uma página de produto | Não | Sim — alerta educativo automático |
| Calculadora de preço justo por peça | "Custo por modelo" em alguns, com ficha técnica | Não | Sim — em 10 s, sem ficha técnica |

### 1.6 Personas

**Persona principal: dono ou dona de taller familiar**

| Atributo | Descrição |
|---|---|
| Nome fictício | **Doña Rosa / Don Wilfredo**, 30 a 50 anos |
| Onde | Brás, Bom Retiro, Pari, ou periferia de SP (Zona Norte/Leste, Guarulhos), para onde muitas oficinas migraram (TOPVIEW, UNESP) |
| Tamanho | De 3 a 15 máquinas (recta, overlock, collareta, interlock), equipe familiar + alguns costureiros. ⚠️ A faixa de 3 a 15 máquinas é **hipótese a validar** |
| Dispositivo | Celular Android em ~90% do uso (⚠️ **hipótese a validar**), muitas vezes com plano pré-pago e pouca memória livre |
| Idioma | Espanhol em casa e na oficina, português com contratante, banco e órgãos públicos. Pode ler melhor do que escrever nas duas línguas (⚠️ **hipótese**) |
| Documento | CPF e/ou RNM/CRNM. Pode ter ou não ter MEI (CNAE 1412-6/03) |
| Dores | Calote ou atraso do intermediário; briga no acerto do sábado; não saber se o preço por peça cobre os custos; medo de fiscalização |
| Ganhos desejados | Receber em dia, ter prova, saber o lucro real, parecer profissional diante do contratante |
| Gatilho de compra | Ter levado um calote recentemente, ou indicação de um conhecido da comunidade (⚠️ **hipótese**) |
| Objeções | "É caro", "não sei mexer", "vai cair na mão do governo", "o contratante não vai clicar" |

**Persona secundária 1: costureiro ou costureira**

- Quer saber **quanto produziu, quanto pegou de adelanto e quanto vai receber no sábado**, sem desconfiança.
- **Não precisa de conta no MVP.** Recebe pelo WhatsApp do dono um **recibo bilíngue** (link público só de leitura, com token, ou imagem/PDF).
- Na v1.1, terá um link pessoal só de leitura com o "meu extrato da semana" (⚠️ **hipótese**: medir se aumenta a confiança e a retenção do dono).
- Cuidado de LGPD: o recibo mostra **só os dados da própria pessoa**, nunca os da equipe.

**Persona secundária 2: contratante ou intermediário ("corte" / marca)**

- Recebe um **link público `/c/[token]` pelo WhatsApp**, abre no celular **sem baixar app e sem criar conta**, vê fotos, grade, quantidades e valor combinado, e toca em **"Confirmo recebimento"** (ou **"Recebi com divergência"**, informando a quantidade real).
- Paga com **Pix Copia e Cola / QR** da chave do taller, ali mesmo.
- O que ganha (hipótese de venda B2B futura): rastreabilidade de oficinas regulares. Isso conversa com a Lei paulista 14.946/2013 (cassação do ICMS de quem vende produto feito com trabalho escravo em qualquer etapa da cadeia).

### 1.7 O que é inovador, simples e vende (MVP + corte v1.1)

Critério para entrar no MVP: (a) resolve a dor nº 1 (calote/prova) ou nº 2 (acerto/preço); (b) funciona com uma mão, no celular, em menos de 30 s; (c) dá para demonstrar numa conversa de WhatsApp.

#### Inovação 1: Apontamento relâmpago por voz + foto em 20 s, com fila offline

Registrar um lote recebido (contratante, referência, quantidade, grade, preço por peça, prazo, foto do pacote/ficha) e o apontamento de produção falando ou tocando em botões grandes, **mesmo sem sinal**.

- **Voz por campo** (mais robusta que um parser de frase livre): um botão de microfone ao lado de "Quantidade", "Preço por peça" e "Prazo". Usa a Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) com `lang` em cadeia de fallback: `es-BO` → `es-419`/`es-US` → `es-ES` (UI em ES) e `pt-BR` (UI em PT). O texto é normalizado por um parser de números em ES e PT ("trescientas", "dos cincuenta", "dois e cinquenta" → `300`, `250` centavos). **O resultado sempre aparece num campo editável antes de salvar.**
- ⚠️ **Limite real a documentar:** no Chrome Android o reconhecimento de voz costuma depender de conexão, e o suporte a `es-BO` não foi verificado. **Sem sinal, o botão de microfone some** e entra o teclado numérico grande (fallback de digitação rápida com chips de valores recentes: "R$ 2,50", "R$ 3,00", "300 pzs"). O **offline garantido é o da fila**, não o da voz.
- **Foto:** `<input type="file" accept="image/*" capture="environment">`, compressão no cliente (WebP, lado maior ~1600px), **remoção de EXIF/GPS** (minimização LGPD), Blob guardado no IndexedDB até sincronizar.
- **Fila offline:** IndexedDB (Dexie ou `idb` / `idb-keyval`) com cada mutação levando um `clientMutationId` (UUID v7) + `workshopId` + payload. Sync ao voltar o 4G (`online` event + Background Sync quando houver suporte + retry com backoff). O servidor é **idempotente** pela tabela `offline_sync_queue` (seção 4).
- **PWA:** `@serwist/next` 9.5.13 para precache do app shell e das rotas principais. `experimental.useOffline` do Next 16 só como camada de UI ("Sem sinal: salvo no celular, sincroniza depois"), e **marcado como experimental**.

Por que vende: demonstra em 20 s numa visita ao taller. Nenhum produto encontrado faz offline.

#### Inovação 2: Link público de prova de entrega bilíngue ("Escudo Anti-Calote")

Ao marcar "Entregue", o taller gera `/c/[token]`: um link único, bilíngue, com fotos, grade e quantidades, valor combinado, data e hora, e o botão **"Confirmo recebimento / Confirmo el recibimiento"**, que o contratante clica direto do WhatsApp **sem login**.

- Token aleatório de 128 bits (base64url), sem dado pessoal na URL, `noindex`, rate limit e revogável.
- **Snapshot imutável:** quando o link é gerado, os dados da entrega são congelados em JSON canônico e o servidor calcula o `content_sha256`, que aparece no rodapé do recibo ("Código de verificação"). Qualquer alteração exige uma **nova versão** (a anterior continua no histórico). O banco bloqueia `UPDATE` no snapshot depois da confirmação (trigger).
- **Evidências registradas:** abertura do link ("visto em"), confirmação (nome digitado + checkbox "Confirmo que recebi as quantidades acima" + IP + User-Agent + timestamp UTC, exibido em America/Sao_Paulo), ou divergência (quantidade recebida + comentário).
- **PDF/recibo "Recibo Não Fiscal"** gerado no servidor, bilíngue, com o histórico de todas as entregas e de **vários contratantes**.
- **Bônus jurídico (argumento de venda):** o TST, em geral, não considera terceirização o contrato de facção quando há produto acabado, **autonomia e ausência de exclusividade e de ingerência**. Um histórico com **vários contratantes, preços negociados e entregas** ajuda a documentar essa autonomia. ⚠️ Usar como **"ajuda a documentar"**, nunca como garantia.
- ⚠️ **Valor probatório:** é prova eletrônica simples (não é assinatura ICP-Brasil). Validar com advogado e com o `leis-mcp` a força probatória de um aceite eletrônico simples (ex.: MP 2.200-2/2001, art. 10, §2º, que **não foi conferida na sessão de pesquisa** e precisa ser checada).
- Cada link aberto pelo contratante divulga o produto (rodapé discreto "Hecho con [nome] / Feito com [nome]"; decisão A12).

#### Inovação 3: Painel "Quem me deve e há quantos dias" + cobrança no WhatsApp em 1 clique com Pix

Lista de recebíveis por contratante com o **número de dias em aberto** em destaque (0–7 verde, 8–15 amarelo, 16+ vermelho, usando só tokens semânticos) e botão **"Cobrar no WhatsApp"**.

- Mensagem pronta e bilíngue montada com `https://wa.me/<telefone>?text=<urlencoded>`, com o link `/c/[token]` e o **Pix Copia e Cola** do taller.
- **Pix estático com valor (BR Code EMV)** gerado no próprio app a partir da chave Pix do taller (payload EMV + CRC16, campos chave, nome, cidade, valor, txid). Não precisa de API de banco. **QR dinâmico** depende da API do PSP do taller e fica **fora do MVP**.
- Como o dinheiro cai **direto na conta do taller**, não existe webhook de pagamento do contratante: a baixa é **manual** (pagamento total ou parcial) com 1 toque. O contratante também pode tocar em "Já paguei" no link público, o que gera uma notificação para o taller conferir (não dá baixa automática).
- Sugestão de chave: aleatória (EVP), celular ou e-mail, em vez de CPF, para não expor documento (LGPD). O dono escolhe e é avisado antes.

#### Inovação 4: Acerto transparente com alerta legal automático

Produção por pessoa (peças × valor da operação, por máquina) − adelantos = **recibo bilíngue** compartilhável no WhatsApp do costureiro.

Alerta educativo (**não bloqueia**):

- Quando o **valor por dia trabalhado** de alguém fica abaixo do **piso diário do salário mínimo** (CLT art. 78, para quem é **empregado** e recebe por peça), aparece: "⚠️ El pago diario de Juan quedó por debajo del mínimo por día. Si Juan es empleado, la ley (CLT art. 78) garantiza al menos el salario mínimo diario. Habla con tu contador." / "⚠️ O pagamento diário do Juan ficou abaixo do mínimo por dia. Se o Juan é empregado, a lei (CLT art. 78) garante pelo menos o salário mínimo diário. Fale com seu contador."
- O valor do salário mínimo **não fica fixo no código**: é um parâmetro configurável (`legal_params.minimum_wage_monthly_cents`, com data de vigência) e **precisa ser confirmado** pelo decreto vigente via `leis-mcp`. Piso diário = mensal ÷ 30 (regra a confirmar com o contador).
- **Alerta de jornada excessiva:** se o apontamento indicar mais de X horas por dia (parâmetro, padrão a definir com advogado: **hipótese**), aparece um aviso educativo sobre jornada.
- Protege os dois lados: o trabalhador vê o cálculo, e o dono se protege de acusação e entende o risco antes.

#### Inovação 5: Calculadora "Esse corte dá lucro ou prejuízo?"

Em 10 s, antes de aceitar o pacote:

- Entradas: custo fixo mensal da oficina (aluguel, luz, manutenção, linha média), nº de pessoas, horas por dia, dias por mês, **peças por hora** da operação mais lenta (ou o tempo por peça) e preço oferecido.
- Saídas: **custo por minuto**, **preço mínimo saudável por peça**, **lucro ou prejuízo do lote inteiro** e **meta de peças por hora para empatar**.
- Fórmulas (todas em centavos):
  - `minutos_mes = pessoas × horas_dia × 60 × dias_mes`
  - `custo_minuto = (custo_fixo_mes + folha_estimada_mes) / minutos_mes`
  - `custo_peca = custo_minuto × minutos_por_peca`
  - `margem_lote = (preco_oferecido − custo_peca) × quantidade`
  - `pecas_hora_empate = 60 / ((preco_oferecido) / custo_minuto)`, equivalente a `60 × custo_minuto / preco_oferecido`
- Há ainda **preço mínimo saudável** = custo + margem alvo configurável, padrão 20% (⚠️ **hipótese**).
- Resultado com cor semântica e frase curta: "Este corte da pérdida de R$ 180. Necesitas R$ 0,60 más por pieza." / "Este corte dá prejuízo de R$ 180. Você precisa de R$ 0,60 a mais por peça."
- Os valores ficam salvos como "perfil da oficina" para os próximos cálculos. A calculadora também funciona **sem login**, na landing, como isca de aquisição (decisão A13).

#### Corte MVP vs v1.1

| Funcionalidade | MVP (semana 1–4) | v1.1 (pós 10 pagantes) |
|---|---|---|
| Lote recebido (manual + foto + voz por campo) | Sim | Parser de frase livre ("300 poleras a 2,50 para el viernes") |
| Fila offline + sync | Sim — lotes, apontamentos, adelantos | Fotos grandes com sync em segundo plano otimizado |
| Prova de entrega `/c/[token]` + PDF | Sim | Assinatura desenhada no dedo; versão em áudio |
| Recebíveis + cobrança WhatsApp + Pix estático | Sim | Lembrete agendado; QR dinâmico via PSP |
| Produção por pessoa + adelantos + acerto + recibo | Sim | Link pessoal do costureiro (extrato) |
| Alerta CLT art. 78 | Sim | Relatório mensal de conformidade para o contador |
| Calculadora de preço | Sim | Histórico de preço por contratante e por modelo |
| Assinatura R$ 35 (AbacatePay) | Sim | Plano anual (hipótese) |
| Multiusuário (ajudante/encarregada) | Não (só dono) | Sim — papéis `owner`/`helper` |
| Selo "Oficina Regular" para o contratante (B2B) | Não | v2 (hipótese) |
| Login por telefone/WhatsApp OTP | Não (e-mail no MVP) | Sim, depois de validar |

### 1.8 O que o produto NÃO é (corte de escopo)

- Não emite nota fiscal (NF-e/NFS-e). Emite só **"Recibo Não Fiscal / Comprobante No Fiscal"** e orienta o uso do Emissor Nacional NFS-e.
- Não é folha de pagamento nem eSocial.
- Não processa o dinheiro do taller. O Pix vai **direto da conta do contratante para a chave do taller**. O SaaS só gera o código Pix e registra a baixa.
- Não tem ficha técnica, OP, PCP nem cadastro de modelo complexo no MVP.
- Não é marketplace de cortes (talvez numa v2, como hipótese).

### 1.9 Modelo de negócio, preço e unit economics (AbacatePay)

**Plano único: R$ 35,00/mês**, sem fidelidade, cancela quando quiser, pelo próprio painel. Detalhe técnico da API, webhooks e checkout está na seção 2.7.

**Taxas conferidas em 13/11/2026** em https://www.abacatepay.com/pricing (AbacatePay **sem mensalidade**):

| Meio | Taxa AbacatePay | Conta | **Líquido** | % |
|---|---|---|---|---|
| **Pix Automático** | R$ 0,80 por cobrança | 35,00 − 0,80 | **R$ 34,20** | **97,7%** |
| Cartão à vista D+30 | 3,5% + R$ 0,60 | 35 × 0,035 + 0,60 = 1,825 | **R$ 33,18** | 94,8% |
| Cartão à vista D+1 | 5,42% + R$ 0,60 | 35 × 0,0542 + 0,60 = 2,497 | **R$ 32,50** | 92,9% |

Outras taxas públicas: Pix avulso R$ 0,80 por transação (também por cobrança de Pix Automático: https://www.abacatepay.com/o-que-e/pix-automatico) · Débito 2,5% + R$ 0,60 · Boleto R$ 2,50 · Assinaturas com as mesmas taxas do Pix e do cartão · Saque Pix R$ 0,80 (até 20/mês, depois R$ 2,50) · TED R$ 5. **MEI pode usar a AbacatePay, mas CNPJ é obrigatório para a conta do SaaS.** Os valores acima são **antes de impostos do SaaS e de infraestrutura** (Neon/Vercel).

**Custos fixos e variáveis** (⚠️ todos a confirmar):

| Item | Estimativa | Status |
|---|---|---|
| Neon Postgres | Plano Free no início; Launch quando crescer | Variável a confirmar (limites e preço atuais na página do Neon) |
| Vercel | Hobby para protótipo; **Pro para uso comercial** | **A confirmar**: os termos do plano Hobby da Vercel restringem uso comercial; verificar antes de cobrar o primeiro cliente |
| Domínio `.com.br` | ~R$ 40/ano | A confirmar no Registro.br |
| Storage de fotos (Vercel Blob ou Cloudflare R2) | Free tier no início | A confirmar limites (seção 7, C5) |
| E-mail transacional (OTP/magic link) | Free tier de um provedor (ex.: Resend) | A confirmar |
| Impostos do SaaS | Depende do enquadramento (MEI ou Simples) | **A confirmar com contador**. ⚠️ Verificar se a atividade de licenciamento de software (LC 116, item 1.05) **cabe no MEI**: muitas atividades de software não constam do Anexo XI |

**Simulação** (exemplo com números de **hipótese**, só para ilustrar o cálculo): custo fixo mensal de infra + ferramentas = **R$ 200** (hipótese); 70% dos assinantes em Pix Automático e 30% em cartão D+30 (hipótese); imposto efetivo de 6% sobre a receita (hipótese; confirmar o regime com o contador).

- Receita líquida média por assinante antes do imposto: 0,7 × 34,20 + 0,3 × 33,18 = **R$ 33,89**
- Imposto (6% de R$ 35): R$ 2,10 → **líquido ≈ R$ 31,79 por assinante**
- **Ponto de equilíbrio:** 200 ÷ 31,79 ≈ **6,3 → 7 assinantes**

| Assinantes | MRR bruto | Líquido estimado/mês (hipótese) |
|---|---|---|
| 10 | R$ 350 | ≈ R$ 318 − 200 = **R$ 118** |
| 50 | R$ 1.750 | ≈ R$ 1.590 − 200 = **R$ 1.390** |
| 100 | R$ 3.500 | ≈ R$ 3.179 − 200 (infra cresce: hipótese) |
| 300 | R$ 10.500 | ≈ R$ 9.537 − infra |

**CAC (hipótese):** com venda presencial e por indicação, o CAC é quase só o tempo do Rafael. Se houver comissão de indicação para lojas de aviamentos (ex.: **1 mensalidade por cliente que ficar 2 meses**: hipótese), o payback é de cerca de 1 mês.

**Churn (hipótese):** a sazonalidade da moda (entressafra) pode gerar cancelamentos. Mitigação: a reativação é fácil e os dados ficam guardados no **modo leitura** (nunca apagar no vencimento).

#### Restrição crítica: trial e cupom só no cartão

Segundo a doc da AbacatePay: **cupom e trial não valem no Pix Automático (só no cartão)**. A assinatura no cartão é sempre à vista. É um produto por checkout e um checkout por cliente. O **Pix Automático precisa ser liberado na conta (inclusive no Modo Teste)**, e assinaturas em produção também precisam de liberação.

**Estratégia recomendada (padrão, a confirmar na decisão A3): "valor primeiro, paywall depois".**

```mermaid
flowchart TD
  A["Cadastro em 60s<br/>sem cartão, sem CNPJ"] --> B["Modo grátis: 3 lotes completos<br/>receber → entregar → cobrar"]
  B -->|"4º lote ou 30 dias"| C{"Paywall bilíngue"}
  C -->|Recomendado| D["Pix Automático R$ 35/mês<br/>autoriza uma vez no app do banco<br/>Garantia de 7 dias CDC art. 49"]
  C -->|Alternativa| E["Cartão: 7 dias grátis<br/>depois R$ 35/mês"]
  D --> F["subscription.completed → ativo"]
  E --> G["subscription.trial_started → trial"]
  G --> H["subscription.renewed → ativo"]
  C -->|Não assina| I["Modo leitura: vê, exporta e renova<br/>dados nunca são sequestrados"]
```

Regras de produto:

1. **Freemium operacional de 3 lotes** (sem cartão): o trial "real" acontece **dentro do app**, então independe do meio de pagamento e contorna a limitação do Pix Automático. O usuário vive o "aha" (o primeiro link de prova confirmado) antes de pagar. ⚠️ Os números 3 lotes / 30 dias são **hipótese a validar**.
2. No paywall, mostrar as duas opções lado a lado, com honestidade:
   - **Pix Automático (recomendado):** "R$ 35/mês. Autoriza uma vez no app do seu banco. Se não gostar, devolvemos tudo em até 7 dias." (CDC art. 49)
   - **Cartão:** "7 dias grátis, depois R$ 35/mês. Cancela quando quiser."
3. Técnica: talvez sejam precisos **dois produtos** na AbacatePay (um `MONTHLY` sem `trialDays` para Pix/cartão e um `MONTHLY` com `trialDays: 7` só para cartão), porque não está claro na doc como o `trialDays` do produto se comporta quando `methods` inclui `PIX`. ⚠️ **Testar no Modo Teste antes de decidir.**
4. **Reembolso de 7 dias:** verificar se a API da AbacatePay tem endpoint de reembolso. ⚠️ **Não verificado.** Se não tiver, criar um fluxo operacional manual (Pix de devolução) com SLA ≤ 7 dias e registro no painel administrativo.
5. Cupom (ex.: "KANTUTA" para feira) só funciona no cartão: usar cupom **apenas** em ações de campo onde o cartão faça sentido. No Pix, o equivalente é "mais lotes grátis" no modo freemium.

### 1.10 Distribuição (primeiros 10 a 50 pagantes), teste de 48h e anti-tese

#### Canais

⚠️ Todos os canais abaixo são **hipóteses de go-to-market**, sem verificação por fonte.

| Canal | Ação concreta | Meta (hipótese) |
|---|---|---|
| **Visita presencial** a talleres (Brás, Bom Retiro, Pari, Zona Norte/Leste) | Demo de 3 minutos no celular do dono: cadastra um lote real e envia um link de prova para o próprio contratante dele | 20 visitas → 5 pagantes |
| **Lojas de aviamentos e de manutenção de máquinas** (Brás, Bom Retiro) | Cartaz bilíngue com QR + comissão por indicação | 3 lojas parceiras |
| **Feira Kantuta (Pari) e Rua Coimbra (Brás)** | Mesa de demonstração aos domingos; panfleto com QR | 30 cadastros por feira |
| **Grupos de WhatsApp e Facebook da comunidade** | Vídeo curto de 30 s em espanhol: "Cómo cobrar un corte que no te pagaron" | Tráfego para a landing |
| **Rádios e páginas bolivianas de SP** | Entrevista ou spot sobre "proteger o taller do calote" | Autoridade |
| **ONGs, associações de migrantes e cursos de gestão para costureiros** (como os citados pela Folha, 2015) | Oficina gratuita "Precio justo y cobro" usando a calculadora | Parceria institucional |
| **Viral embutido** | Rodapé do link `/c/[token]` aberto pelos contratantes, que conhecem muitos talleres | Indicações |

#### Teste de validação em 48 h (antes ou em paralelo ao código)

**Objetivo:** validar (1) a dor de prova e cobrança, (2) a disposição de pagar R$ 35 e (3) o vocabulário.

| Hora | Ação |
|---|---|
| 0–4h | Landing bilíngue de uma página (pode ser feita no próprio Next com a tela `/c/[token]` falsa) + botão "Quiero probar / Quero testar" que abre o WhatsApp do Rafael |
| 4–8h | Protótipo navegável do link de prova (HTML estático com fotos de exemplo) e da calculadora (funcional, sem banco) |
| 8–36h | **10 conversas** (presenciais ou por vídeo) com donos de taller, com roteiro fixo (abaixo) |
| 36–48h | **Pré-venda**: oferecer o 1º mês por Pix de R$ 35 com garantia de devolução se o app não sair em 30 dias, ou lista de espera com compromisso |

**Roteiro (ES):**

1. "¿Le pasó alguna vez entregar un corte y no recibir el pago? ¿Cuánto fue? ¿Qué hizo?"
2. "¿Cómo anota hoy lo que recibe, lo que produce cada persona y los adelantos?"
3. Mostrar o link de prova: "¿Su cliente haría clic en 'Confirmo'? ¿Por qué sí o no?"
4. "¿Cómo llama usted a: corte/paquete, recta, overlock, collareta, interlock, adelanto, arreglo?"
5. "Si esto le evita un calote al año, ¿pagaría R$ 35 por mes? ¿Por Pix o tarjeta?"

**Critérios de sucesso (hipótese):** ≥ 7/10 relatam calote ou atraso nos últimos 12 meses; ≥ 5/10 dizem que o contratante clicaria; **≥ 3/10 pagam a pré-venda ou deixam o Pix Automático autorizado**. Abaixo disso, revisar o recorte (ex.: focar na calculadora + acerto antes da prova).

#### Anti-tese: os 3 riscos que podem matar o produto em 60 dias

| # | Risco | Por que mata | Mitigação concreta |
|---|---|---|---|
| 1 | **O contratante não clica em "Confirmo"** (o lado mais forte não coopera) | Sem confirmação, o "Escudo Anti-Calote" perde força | (a) O link vale como prova mesmo sem clique: registra **envio, abertura ("visto em" com IP e horário)**, fotos e snapshot com hash; (b) botão alternativo "Recibí con diferencia" (menos constrangedor); (c) o Pix está no mesmo link, então o contratante abre para pagar; (d) mensagem padrão educada e bilíngue, que não acusa ninguém |
| 2 | **Medo de "registro" e de fiscalização + desconfiança de app** | Não cadastra nem usa | Posicionar como **proteção e formalização**; não pedir CNPJ; não pedir documento dos costureiros (CPF/RNM opcionais); política de privacidade bilíngue curta ("Sus datos son suyos. No vendemos ni compartimos."); exportar e excluir com 1 toque; embaixadores da comunidade; demonstração presencial |
| 3 | **Baixa disposição de pagar mensalidade / Pix Automático não liberado a tempo** | Receita zero ou muito atraso | Pedir **hoje** a liberação de Pix Automático + Assinaturas na AbacatePay (inclusive no teste); freemium de 3 lotes para provar valor; garantia de 7 dias; plano de contingência: cobrança mensal via checkout Pix avulso (não recorrente) até a liberação |

**Riscos adicionais (monitorar):**

- **Uso indevido** para "documentar" condições ilegais: termos proíbem trabalho análogo à escravidão (CP art. 149) e o app tem alertas de piso e jornada. A conta pode ser suspensa diante de indícios, com canal de denúncia.
- **Voz falhando** com sotaque ou ruído de máquina: a voz é atalho, nunca caminho único.
- **Sazonalidade e churn:** modo leitura + reativação com 1 toque.

### 1.11 Métricas de sucesso do MVP

⚠️ Todas as metas abaixo são **hipótese**.

| Métrica | Definição | Meta em 60 dias |
|---|---|---|
| Ativação | % de cadastros que geram o 1º link de prova em ≤ 24 h | ≥ 40% |
| "Aha" confirmado | % de links de prova **confirmados** pelo contratante | ≥ 30% |
| Conversão do freemium | % que assina depois dos 3 lotes | ≥ 15% |
| Pagantes | Assinaturas ativas | 10 (dia 30) → 50 (dia 60) |
| Retenção M1 | % que renova o 2º mês | ≥ 80% |
| Mix de pagamento | % em Pix Automático | ≥ 60% |
| Tempo de registro de lote | Mediana do toque em "Novo lote" até "Salvo" | ≤ 20 s |
| Sync offline | % de mutações sincronizadas sem conflito | ≥ 99% |

### 1.12 Itens NÃO encontrados ou NÃO verificados na pesquisa

Não invente o que está nesta lista. Trate como pendência ou como hipótese.

- Página inicial do `seeb-widget.pages.dev` (HTTP 404); licença do SeeB; atributos de configuração do SeeB (não existem no código lido); suporte do SeeB a espanhol (o painel é só em PT-BR).
- Skill chamada "vademecum" para Claude: não encontrada. O achado viral de novembro/2026 foi o **leis-mcp** + acervo **ctresb/leis**.
- Percentuais de calote não conferidos no texto integral da fonte: **não usar em landing, pitch ou material público** nenhum percentual que não tenha sido aberto e citado no original.
- Alguns preços de softwares tradicionais vieram só de resumos de busca e não foram abertos na página do produto. O único preço de facção **conferido na própria página** foi R$ 97/mês.
- Suporte a login por OTP via SMS/WhatsApp no Neon Auth: não verificado.
- Textos do Planalto (Lei 13.429, Marco Civil, CDC, Decreto 7.962, LC 116) e a MP 2.200-2/2001, art. 10, §2º: URLs no padrão oficial, mas as páginas não foram abertas na sessão de pesquisa. Conferir com o `leis-mcp`.
- Endpoint de reembolso da AbacatePay: não verificado.
- Domínio exato do checkout da AbacatePay para a CSP (`form-action`): a confirmar.


---

## 2. Arquitetura e Stack (versões exatas, 11/2026)

Versões conferidas no npm em **13/11/2026**. Use exatamente estas, salvo se o Rafael pedir atualização.

### 2.1 Versões dos pacotes

| Camada | Pacote | Versão | Observação |
|---|---|---|---|
| Framework | `next` | **16.4.6** | App Router; **`src/proxy.ts` substitui `middleware.ts`** (a exportação nomeada `middleware` vira `proxy`). Docs: https://nextjs.org/docs/app/api-reference/file-conventions/proxy · upgrade: https://nextjs.org/docs/app/guides/upgrading/version-16 |
| UI runtime | `react` / `react-dom` | **19.3.1** | Server Components + Server Actions |
| Linguagem | TypeScript | strict | `"strict": true`, `noUncheckedIndexedAccess: true` |
| Pacotes | `pnpm` | **12.18.0** | `"packageManager": "pnpm@12.18.0"` no `package.json` (Corepack). Comandos: `pnpm create next-app@latest`, `pnpm add`, `pnpm dlx shadcn@latest …`, `pnpm drizzle-kit generate\|migrate` |
| i18n | `next-intl` | **4.15.1** | `locales: ['es','pt-BR']`, seletor com 1 toque no topo. Docs: https://next-intl.dev/docs/routing/setup · https://next-intl.dev/docs/routing/middleware |
| Estilo | `tailwindcss` | **4.3.5** | Tokens em **OKLCH** em `src/styles/tokens.css` (paleta do Usopp **entregue em 13/11/2026**: copiar `./tokens.css` tal como está; resumo na seção 8). Docs shadcn + Tailwind v4: https://ui.shadcn.com/docs/tailwind-v4 |
| Componentes | `shadcn` (CLI) | **4.23.0** | `pnpm dlx shadcn@latest init` (ou `-t next` em projeto novo) e `pnpm dlx shadcn@latest add button card dialog sheet form input select tabs sonner`. Ícones: `lucide-react`. Changelog: https://ui.shadcn.com/docs/changelog |
| ORM | `drizzle-orm` / `drizzle-kit` | **0.45.4** / **0.31.11** | `drizzle-orm/neon-http`. ⚠️ Prisma `latest` aponta para um RC (8.0.0-rc.33); por isso **escolhemos Drizzle**. A estável anterior do Prisma é a tag `prev` 7.10.1 — não usar no MVP |
| Driver DB | `@neondatabase/serverless` | **1.2.1** | URL **pooled** (`-pooler`) no runtime; URL **direta** (sem `-pooler`) só para migrações (`DATABASE_URL_UNPOOLED`). Docs: https://neon.com/docs/guides/nextjs |
| Auth | `better-auth` **1.7.23** (padrão do MVP) | | Alternativa: `@neon/auth` 0.8.2 ("Managed Better Auth") — ver 2.3 |
| Validação | `zod` | **4.6.7** | Esquemas compartilhados entre cliente, Server Action e fila offline |
| Pagamentos | `@abacatepay/sdk` | **3.1.1** | Publicado em 10/11/2026. API v2, assinaturas. Doc: https://docs.abacatepay.com/pages/sdk/node. Há também `@abacatepay/rest` 1.1.0 e o CLI de MCP `abacatepay` 1.0.1 |
| PWA/offline | `@serwist/next` | **9.5.13** | + IndexedDB (Dexie ou `idb`) para a fila. Guia PWA do Next: https://nextjs.org/docs/app/guides/progressive-web-apps |
| Testes | `vitest` / `@playwright/test` | **5.1.0** / **1.65.1** | + `@axe-core/playwright` **4.14.0** |
| Lint a11y | `eslint-plugin-jsx-a11y` | **6.10.2** | |

### 2.2 Diagrama de arquitetura

```mermaid
flowchart LR
  subgraph Cliente["Celular Android (PWA)"]
    UI["Next.js App Router<br/>RSC + Client Components"]
    SW["Service Worker<br/>Serwist"]
    IDB[("IndexedDB<br/>fila offline + fotos")]
    SPEECH["Web Speech API<br/>es / pt-BR"]
    SEEB["Widget SeeB<br/>Shadow DOM"]
    UI <--> IDB
    UI --> SPEECH
    SW --> UI
  end

  subgraph Vercel["Vercel (Edge + Node)"]
    PROXY["src/proxy.ts<br/>next-intl + checagem otimista de sessão"]
    RSC[Server Components]
    SA["Server Actions<br/>lote, entrega, acerto"]
    API["Route Handlers<br/>/api/sync · /api/webhooks/abacatepay · /api/pdf"]
    CRON["Vercel Cron<br/>retenção de logs · vencimentos"]
  end

  subgraph Dados
    NEON[("Neon Postgres<br/>Drizzle")]
    BLOB[("Storage de fotos<br/>Vercel Blob ou R2")]
  end

  subgraph Externos
    ABACATE["AbacatePay v2<br/>assinatura R$ 35"]
    MAIL["E-mail OTP / magic link"]
    WA["WhatsApp<br/>wa.me deep link"]
    CONTR["Contratante<br/>/c/token sem login"]
  end

  UI --> PROXY --> RSC
  UI --> SA
  IDB -->|sync idempotente| API
  RSC --> NEON
  SA --> NEON
  API --> NEON
  SA --> BLOB
  API <-->|webhooks HMAC| ABACATE
  SA --> ABACATE
  SA --> MAIL
  UI --> WA --> CONTR
  CONTR --> RSC
  CRON --> NEON
```

Conexão Neon (padrão obrigatório):

```ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
export const db = drizzle(neon(process.env.DATABASE_URL!));
```

Branching do Neon: **um branch por preview/PR** para testar migrações.

### 2.3 Autenticação (decisão A7/A8; padrão do MVP)

| Opção | Prós | Contras | Recomendação |
|---|---|---|---|
| **Better Auth self-hosted** no mesmo Neon (`better-auth` 1.7.23) com plugin de **OTP por e-mail** ou **magic link** | Controle total, tabelas no nosso Postgres, plugin de telefone disponível para depois | Mais código de configuração | **Padrão do MVP** |
| **Neon Auth** (`@neon/auth` 0.8.2, "Managed Better Auth", `createNeonAuth({ baseUrl: NEON_AUTH_BASE_URL, cookies: { secret } })`) | Menos infraestrutura | ⚠️ suporte a OTP por SMS/WhatsApp **não verificado** | Avaliar se o e-mail bastar |
| OTP por **telefone/WhatsApp** | Melhor para o público (todo mundo tem WhatsApp) | Exige provedor de SMS ou a WhatsApp Business Platform com **empresa verificada e template de autenticação aprovado** (custo por mensagem; ⚠️ **verificar**) | v1.1, depois de validar |

Regra de UX: **sem senha**. Código de 6 dígitos com `inputmode="numeric"` e `autocomplete="one-time-code"`, com sessão longa (ex.: 60 dias, renovada a cada uso; ⚠️ **valor a definir**).

Tabelas do Better Auth: `user`, `session`, `account`, `verification` (geradas pelo CLI do Better Auth; mapear `users` = `user`).

### 2.4 Estrutura de pastas

```
src/
  proxy.ts                         # next-intl + redirect /c/[token] → /{locale}/c/[token]
  i18n/{routing.ts,request.ts}
  messages/{es.json,pt-BR.json}
  config/{brand.ts,legal.ts}       # nome, locale padrão, dados legais (Rafael preenche)
  app/
    manifest.ts
    icon.svg  apple-icon.png
    [locale]/
      layout.tsx                   # <html lang={locale}> + <div id="app"> + SeeB
      (public)/page.tsx            # landing
      (public)/precios|privacidad|terminos|quienes-somos|accesibilidad
      (auth)/entrar/page.tsx
      (app)/hoy/page.tsx           # Dashboard
      (app)/lotes/nuevo/page.tsx
      (app)/lotes/[id]/page.tsx
      (app)/produccion/page.tsx    # apontamento + adelantos + acerto
      (app)/cobros/page.tsx        # entregas e cobranças
      (app)/calculadora/page.tsx
      (app)/cuenta/page.tsx        # assinatura, legal, LGPD, exportar
      c/[token]/page.tsx           # link público do contratante (sem login)
      r/[token]/page.tsx           # recibo do costureiro (só leitura)
      opengraph-image.tsx
    api/
      sync/route.ts                # fila offline (POST em lote, idempotente)
      upload/route.ts              # URL assinada para foto
      webhooks/abacatepay/route.ts
      pdf/[kind]/[id]/route.ts
      cron/retention/route.ts
      cron/subscription-sweeper/route.ts
  db/{schema.ts,index.ts,tenant.ts}
  lib/{money.ts,pix-brcode.ts,speech/,offline/,legal-params.ts,audit.ts}
  components/ui/                   # shadcn
  styles/{globals.css,tokens.css,fonts.ts}   # tokens.css = cópia exata do ./tokens.css do Usopp
brand/{logo.svg,logo-mark.svg,logo-mono.svg,og-template.tsx}
scripts/generate-icons.ts          # sharp → 192/512/maskable/apple
docs/legal/fontes.md               # trechos de leis via leis-mcp
docs/{PESQUISA-E-CONTEXTO-CLAUDE.md,identidade-visual.md}  # cópias dos arquivos de contexto
.env.example                       # sem valores
```

### 2.5 `src/proxy.ts` (Next.js 16)

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);
// locales ['es','pt-BR'], padrão pelo cookie NEXT_LOCALE ou Accept-Language
// (decisão A2: padrão recomendado = 'es')

export const config = { matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)' };
```

- O link curto `/c/abc…` é redirecionado para `/{locale}/c/abc…` (o roteamento do next-intl faz isso a partir do `Accept-Language`).
- **A autorização real fica no servidor** (em cada Server Component/Action com `requireWorkshop()`). O proxy só faz a checagem **otimista** do cookie de sessão para redirecionar até `/entrar`.

### 2.6 Regras de engenharia inegociáveis

1. **Dinheiro sempre em centavos `integer`** (`3500` = R$ 35,00). Formatação só na borda: `Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' })`.
2. **Multi-tenant estrito:** toda query passa por `tenantDb(workshopId)` e toda tabela de negócio tem `workshop_id NOT NULL` + índice composto que começa por `workshop_id`. Um teste automatizado tenta ler dados de outra oficina e precisa falhar. Proibido usar `db` cru fora de `src/db/tenant.ts` (regra de lint/grep no CI). RLS no Postgres fica para a v1.1 (com o driver HTTP, as variáveis de sessão por transação exigem cuidado extra).
3. **Datas em `timestamptz` (UTC)** e exibição em `America/Sao_Paulo`.
4. **Idempotência** em toda mutação vinda da fila offline (`client_mutation_id`) e em todo webhook (`log_…`).
5. **Sem cor fixa nos componentes:** só tokens semânticos em `src/styles/tokens.css` (formato shadcn/Tailwind v4, OKLCH, temas claro e escuro, mapeados em `@theme inline`). A paleta e a tipografia vêm da identidade visual técnica do Usopp, **já entregue** (`tokens.css` + `identidade-visual.md`, seção 8). Use somente esses tokens; nunca hex solto nos componentes (sem `bg-[#…]` nem cores default do Tailwind).
6. **Toda tela com os 5 estados** (seção 3.2).
7. Gerenciador de pacotes: **somente `pnpm`**.

### 2.7 AbacatePay API v2 — assinatura de R$ 35/mês

Docs: https://docs.abacatepay.com · assinaturas: https://docs.abacatepay.com/pages/cobrar/assinaturas · referência: https://docs.abacatepay.com/pages/subscriptions/reference · criar: https://docs.abacatepay.com/pages/subscriptions/create · SDK: https://docs.abacatepay.com/pages/sdk/node (`AbacatePay({ secret })`, `abacate.checkouts.create`, `customers.list`, paginação por cursor). ⚠️ O nome exato dos métodos do SDK deve ser conferido na doc antes de codar.

**Setup (uma vez):**

1. Pedir à AbacatePay a **liberação de Pix Automático e Assinaturas** (inclusive no Modo Teste). Sem isso, o checkout com `methods: ["PIX"]` não funciona, e assinaturas em produção também precisam de liberação.
2. Criar o produto `cycle: "MONTHLY"`, preço 3500 centavos → `ABACATEPAY_PRODUCT_ID_MONTHLY`. Opcional: um segundo produto com `trialDays: 7` só para cartão (testar o comportamento no Modo Teste).
3. Criar o webhook: `POST https://api.abacatepay.com/v2/webhooks/create` com `{ name, endpoint: "https://<domínio>/api/webhooks/abacatepay", secret: <openssl rand -hex 32>, events: ["subscription.completed","subscription.trial_started","subscription.renewed","subscription.payment_failed","subscription.plan_changed","subscription.cancelled","checkout.completed"] }`. ⚠️ **Webhook não pode ser editado**: para mudar, crie outro e exclua o antigo. Um webhook para teste (URL de preview) e outro para produção.

**Checkout (Server Action):**

```ts
// POST /v2/subscriptions/create
{
  items: [{ id: process.env.ABACATEPAY_PRODUCT_ID_MONTHLY, quantity: 1 }],
  customerId,                       // cria/reaproveita o cliente AbacatePay do workshop
  externalId: `ws_${workshopId}_${yyyymm}`, // idempotente
  completionUrl: `${APP_URL}/${locale}/cuenta?checkout=ok`,
  methods: ["PIX", "CARD"],         // PIX = Pix Automático
  retryPolicy: { maxRetry: 3, retryEvery: 2 }
}
// → retorna checkout bill_… (URL). A subscription subs_… só existe depois do pagamento.
```

Regras da API: `methods` aceita `CARD` (cartão salvo) ou `PIX` (= **Pix Automático**, o cliente autoriza uma vez no app do banco). Cupom e trial **não valem no Pix Automático (só no cartão)**. Assinatura no cartão é sempre à vista. Um produto por checkout e um checkout por cliente. Gerenciar com `GET /subscriptions/get|list` e `POST /subscriptions/cancel`. O cliente também tem um Portal do cliente para cancelar.

**Webhooks v2** (o `billing.paid` é da **v1**, legado: https://docs.abacatepay.com/pages/v1/webhooks):

- `subscription.completed` (contratada e paga, sem trial)
- `subscription.trial_started`
- `subscription.renewed` (cada ciclo pago, inclusive o primeiro depois do trial)
- `subscription.payment_failed`
- `subscription.plan_changed`
- `subscription.cancelled`
- O `checkout.completed` também sai em cada cobrança de assinatura.

Fontes: https://docs.abacatepay.com/pages/webhooks/events/subscriptions · https://docs.abacatepay.com/pages/notificacoes/webhooks · segurança: https://docs.abacatepay.com/pages/notificacoes/seguranca

O payload traz `platformFee` (ex.: 80 centavos no Pix e 133 no cartão para R$ 29,90, conforme os exemplos da doc).

**Webhook `/api/webhooks/abacatepay/route.ts` (ordem obrigatória):**

```ts
export async function POST(req: Request) {
  const raw = await req.text();                          // 1. corpo BRUTO antes de qualquer JSON.parse
  const secret = req.headers.get('x-webhook-secret') ?? new URL(req.url).searchParams.get('webhookSecret');
  if (!safeEqual(secret, env.ABACATEPAY_WEBHOOK_SECRET)) return new Response(null, { status: 401 }); // 2. tempo constante
  const sig = req.headers.get('x-webhook-signature') ?? '';
  const expected = createHmac('sha256', env.ABACATEPAY_PUBLIC_KEY).update(raw).digest('base64');
  if (!safeEqual(sig, expected)) return new Response(null, { status: 401 });  // 3. HMAC-SHA256 base64 com a chave PÚBLICA da AbacatePay
  const evt = JSON.parse(raw);
  const inserted = await db.insert(billingWebhookEvents)
    .values({ id: evt.id /* log_… */, type: evt.event, payload: evt })
    .onConflictDoNothing().returning();                 // 4. idempotência
  if (inserted.length === 0) return Response.json({ ok: true, duplicate: true });
  await applySubscriptionEvent(evt);                      // 5. máquina de estados (transação)
  return Response.json({ ok: true });                     // 6. responder rápido (2xx)
}
```

> `ABACATEPAY_PUBLIC_KEY` é a **chave pública fixa publicada na doc de segurança da AbacatePay**: não é o seu secret nem a `pk_`. Conferir o valor e o nome exato do campo de evento (`event`/`type`) na doc antes de codar.

A máquina de estados da assinatura e o modo leitura estão na Jornada 7 (seção 3).

### 2.8 Assets, PWA e identidade visual (entrega do Usopp concluída; logo pelo Claude)

Arquivos de metadata do App Router (gerados pelo Claude):

- `app/manifest.ts` (`MetadataRoute.Manifest`): `name`, `short_name` (≤12 caracteres), `start_url:"/?source=pwa"`, `display:"standalone"`, `background_color`, `theme_color`, `lang`, ícones **192 e 512 PNG + 512 `purpose:"maskable"`**, `shortcuts` ("Nuevo lote / Novo lote", "Cobrar") e `screenshots` (para o prompt de instalação "rico" no Android). Guia: https://nextjs.org/docs/app/guides/progressive-web-apps
- `app/icon.svg` (favicon vetorial) + `app/icon.png`/`favicon.ico` de fallback, e `app/apple-icon.png` 180×180 (o iOS **não usa** o manifest para o ícone).
- `app/[locale]/opengraph-image.tsx` e `twitter-image.tsx` com `ImageResponse` de `next/og` (1200×630), um por idioma, usando a fonte da marca carregada como ArrayBuffer.
- O iOS só instala pelo menu "Compartilhar → Adicionar à Tela de Início", então crie um componente de instrução bilíngue (o `beforeinstallprompt` não funciona no Safari).
- HTTPS obrigatório; testar local com `next dev --experimental-https`.
- Push no iOS só a partir do 16.4 e com o app instalado.
- Offline: `experimental.useOffline` (experimental) ou Serwist (`@serwist/next` 9.5.13) para registrar lotes sem sinal e sincronizar depois.

**SVGs limpos:** `viewBox` sem `width`/`height` fixos, `currentColor` para herdar o token, sem `<style>` interno nem IDs duplicados, `role="img"` + `<title>` (ou `aria-hidden` se for decorativo), otimizar com SVGO. Ícones de interface via `lucide-react`. Ilustrações próprias (agulha, carretel, máquina reta) num traço único e consistente (diretrizes do Usopp, seção 8 e `identidade-visual.md`, seção 7).

**Identidade visual do Usopp: ✅ entregue em 13/11/2026** (item D1). A logo e os ícones o Claude gera **a partir dela** (seção 8.9 e `identidade-visual.md`, seção 7):

- `src/styles/tokens.css` = cópia exata de `./tokens.css`: variáveis semânticas no formato shadcn/Tailwind v4 em **OKLCH** (`:root` light = padrão da oficina, `.dark` = tema noturno), 6 status do domínio (`paid`, `in-production`, `awaiting-confirmation`, `overdue-calote`, `rework`, `clt-warning`, cada um com `-bg/-fg/-solid/-solid-fg/-border`), aliases de atraso `--aging-ok` (0–7 dias) / `--aging-watch` (8–15) / `--aging-late` (16+), tudo mapeado em `@theme inline`. Importar no `globals.css` logo depois de `@import "tailwindcss";`.
- Tipografia em `src/styles/fonts.ts` via `next/font/google`: `Atkinson_Hyperlegible_Next` (`--font-sans`), `IBM_Plex_Sans` (`--font-display`), `IBM_Plex_Mono` (`--font-mono`). Base de 16px no mobile e 18px a partir de 640px, sempre em `rem`; `.tabular-money` em todo valor em R$ (seção 8.7).
- Contraste verificado nos dois temas: **164 pares, 0 falhas** (AAA no texto principal do light; ≥ 3:1 em bordas, foco e ícones). Alvos de toque ≥ 48px (56px nas ações primárias).
- `brand/`: `logo.svg`, `logo-mark.svg`, `logo-mono.svg`, `og-template.tsx` e o gerador de ícones (`scripts/generate-icons.ts` com `sharp`, exportando 192/512/maskable/apple a partir do SVG).

### 2.9 Skills e ferramentas do Claude Code (instalação no projeto)

**Impeccable** (Paul Bakaus) — "the design vocabulary for your coding agent". Comandos `polish`, `bolder`, `critique`, `audit`, com detector de "AI slop" e um *design hook* que confere cada arquivo de UI editado. Repositório: https://github.com/pbakaus/impeccable · Docs: https://impeccable.style/docs

```bash
npx impeccable install --providers=claude --scope=project
# Depois, recarregar o Claude Code e rodar /impeccable init uma vez.
# Exemplo: /impeccable audit a página de configurações
# Alternativa por plugin: /plugin marketplace add pbakaus/impeccable e instalar pelo /plugin
# Alternativa skills.sh: npx skills add pbakaus/impeccable (instala só a skill, SEM hook; o instalador oficial é preferível)
```

**leis-mcp** (mazulo) + acervo **ctresb/leis** ("Todas as leis do Brasil"): texto exato do artigo, link oficial e avisos de revogação/vigência. Repositórios: https://github.com/mazulo/leis-mcp · https://github.com/ctresb/leis. A base inicial do acervo tem 323.849 normas (os MCPs falam em cerca de 1,2 milhão). Aviso do autor do acervo: OCR e conversão automática **não substituem o Diário Oficial**; confira sempre o campo `fonte`. Uso direto de um arquivo: `https://raw.githubusercontent.com/ctresb/leis/main/<caminho>`. Exemplo da LGPD: https://raw.githubusercontent.com/ctresb/leis/main/federal/leis-ordinarias/2018/lei-13709-2018-08-14.md

```bash
uvx leis-mcp index                          # baixa o índice (~100 MB, só na primeira vez)
claude mcp add leis -s project -- uvx leis-mcp serve
```

Ferramentas: `buscar_norma`, `ler_artigo`, `buscar_texto`, `listar_normas`, recurso `leis://apelidos` (CLT, CDC, LGPD…). Requer `uv`; `rg` recomendado.

**brasil-legal-skills** (orientação MEI/Simples/CDC/LGPD; educativa, não usa o texto oficial). ⚠️ A skill manda incluir um rodapé de atribuição em toda resposta dela: usar como orientação e **não deixar o rodapé vazar para a UI do produto**.

```bash
npx skills add AlissonSantos1/brasil-legal-skills --skill brasil-legal-skills
```

Opcional, como segunda checagem (texto conferido contra o Planalto): MCP do KivoHub.

```bash
claude mcp add --transport http kivohub-leis "https://leis.kivohub.ai/mcp?src=claude-code"
```

Outras candidatas reais encontradas (não são o padrão deste projeto): `pesquisa-de-leis` (KivoHub/plugins), `legislacao-brasileira` (Sentinel Hub), `lgpd-brasil` (ericbsantana), `clt-hr-assistant` (microsoft/cat-agent-skills), `letradalei/skills`, IAJUS, Jusratio (pago). Não existe skill chamada "vademecum" nas buscas feitas.

Como usar as ferramentas jurídicas no código: ver seção 5.2.

### 2.10 Segurança, observabilidade e testes (visão geral)

- **Server Actions:** toda action valida a sessão + `workshopId` + zod + o status do plano (`read_only` bloqueia escrita, com exceções explícitas — decisão A11: "Registrar pago" de dívidas antigas permanece liberado).
- **Rate limit:** `/c/[token]` (confirmação), OTP e `/api/sync` (ex.: Upstash ou tabela própria; ⚠️ **escolher**).
- **Logs Marco Civil:** `lib/audit.ts` grava os eventos `auth.login`, `auth.logout`, `public_proof.view`, `public_proof.confirm`, `public_proof.dispute`, `data.export`, `account.delete`, `subscription.*` com o IP (`x-forwarded-for`, primeiro IP; `x-real-ip` na Vercel) e o timestamp UTC.
- **Cron (Vercel Cron):** `retention` diário (purge de `access_audit_logs` > 6 meses + margem de 30 dias; hard-delete de contas excluídas); `subscription-sweeper` diário (`current_period_end` vencido → `read_only`). Protegidos por `CRON_SECRET` no header `Authorization`.
- **Testes:**
  - Vitest: `money.ts`, `pix-brcode.ts` (CRC16 contra vetores conhecidos), parser de números falados ES/PT, cálculo do acerto e do piso CLT 78, máquina de estados da assinatura, verificação HMAC do webhook (com fixtures da doc). Testes de propriedade (`fast-check`) para somas de acerto. Teste de isolamento multi-tenant (tentar ler dados de outra oficina precisa falhar).
  - Playwright: jornadas 1–7 nos dois idiomas, modo offline (`context.setOffline(true)`) → criar lote → voltar online → sincronizado sem duplicata; axe em todas as telas, nos dois idiomas e nos 5 estados; SeeB + modais (seção 6.3).
- **Observabilidade:** logs estruturados (JSON) nas rotas críticas; alerta para falha de webhook (`billing_webhook_events.error`) e para fila offline com `rejected`.


---

## 3. Fluxos End-to-End, Telas, os 5 Estados e Microcopy Real (ES / PT-BR)

### 3.0 Mapa geral das jornadas

```mermaid
flowchart LR
  J1[J1 Cadastro 60s] --> J2[J2 Receber corte]
  J2 --> J3[J3 Produção diária + adelantos]
  J3 --> J3b[Acerto semanal + recibo]
  J2 --> J4[J4 Entrega + prova /c/token]
  J4 --> J5[J5 Cobrança + Pix + baixa]
  J6[J6 Calculadora] -. antes de aceitar .-> J2
  J1 --> J7[J7 Assinatura R$ 35]
  J7 -. paywall após 3 lotes .-> J2
```

### 3.1 Navegação (mobile-first)

- **Bottom nav (4 itens + FAB):** Hoy/Hoje · Producción/Produção · Cobros/Cobranças · Más/Mais (Calculadora, Clientes, Equipo, Cuenta). FAB central: **"+ Corte"**.
- **Topo:** nome do taller + **seletor de idioma de 1 toque** (`ES | PT`, `aria-label="Cambiar idioma / Mudar idioma"`) + indicador de conexão (🟢 / "Sin señal: 3 pendientes").
- Alvos ≥ 48px, corpo de texto ≥ 16–18px, contraste AA, foco visível.

Convenção de tratamento: **ES em "usted"** (respeitoso; ⚠️ **validar** "usted" vs "tú" nas entrevistas, decisão A6) e **PT-BR em "você"**, sempre no singular.

---

### Jornada 1: Cadastro e onboarding em 60 s

1. **Tela de idioma** (antes de tudo): dois botões grandes com bandeira **e texto** (a bandeira sozinha não é acessível): "Español" / "Português". Salva no cookie `NEXT_LOCALE`.
2. **Entrar:** e-mail (ou telefone na v1.1) → código de 6 dígitos.
3. **Dados da oficina (3 campos):** nome do taller, bairro/cidade, nº de máquinas (stepper). CPF/RNM/CNPJ **opcionais**, preenchíveis depois.
4. **Chave Pix da oficina** (para receber dos contratantes): tipo (aleatória, celular, e-mail, CPF, CNPJ) + chave + nome do recebedor + cidade (campos exigidos pelo BR Code). Aviso: "Recomendamos la llave aleatoria para no mostrar su documento." Pode pular.
5. **Aceites:** Termos + Privacidade (versão registrada) + declaração contra trabalho forçado (L18).
6. Chega em **"Hoy"** com um card de onboarding: "Registre su primer corte (20 s)".

```mermaid
sequenceDiagram
  actor D as Dono do taller
  participant App as PWA
  participant Auth as Better Auth
  participant DB as Neon
  D->>App: Escolhe "Español"
  App->>App: cookie NEXT_LOCALE=es
  D->>App: e-mail
  App->>Auth: send OTP
  Auth-->>D: código por e-mail
  D->>App: 6 dígitos
  Auth->>DB: cria user + session
  D->>App: nome do taller, bairro, máquinas, Pix (opcional)
  App->>DB: insert workshops + workshop_members(owner) + legal_acceptances
  App->>DB: access_audit_logs(login, signup)
  App-->>D: /es/hoy
```

---

### Jornada 2: Receber um corte/lote

1. "Hoy" → botão flutuante **"+ Nuevo corte / + Novo corte"**.
2. Formulário de uma tela só, com campos grandes:
   - Contratante (combobox com criação inline: "+ Nuevo cliente")
   - Referência/modelo (texto livre, opcional)
   - **Foto** do pacote/ficha (câmera)
   - **Quantidade** 🎤 + **grade** (chips P/M/G/GG/únicos com stepper; soma automática que precisa bater com a quantidade, ou "sin grade")
   - Cor (opcional)
   - **Preço por peça** 🎤 (teclado `decimal`) → total calculado ao vivo
   - **Prazo** 🎤 (atalhos "viernes", "en 7 días" + date picker)
   - Avíos: quem fornece (contratante/taller) + observação
3. **Salvar**: com sinal → Server Action; sem sinal → IndexedDB + toast "Guardado en el celular. Se enviará cuando vuelva la señal."
4. O lote fica com status `received` → `in_production` (ao primeiro apontamento ou manualmente).

```mermaid
sequenceDiagram
  actor D as Dono
  participant UI as Form Novo Lote
  participant Q as IndexedDB (fila)
  participant SW as Service Worker
  participant API as /api/sync
  participant DB as Neon
  participant B as Blob
  D->>UI: voz/foto/teclado
  UI->>UI: zod.parse + clientMutationId (uuid v7)
  alt online
    UI->>API: POST mutations[]
  else offline
    UI->>Q: put(mutation + foto Blob)
    UI-->>D: Guardado en el celular
    SW-->>UI: evento online / Background Sync
    UI->>API: POST mutations[] (lote de até 50)
  end
  API->>DB: SELECT offline_sync_queue WHERE client_mutation_id
  alt já processada
    API-->>UI: 200 {status: duplicate, serverId}
  else nova
    API->>B: foto upload via URL assinada
    API->>DB: BEGIN, insert batches + offline_sync_queue, COMMIT
    API-->>UI: 200 {status: applied, serverId}
  end
  UI->>Q: delete(mutation)
```

**Resolução de conflitos:** criação é sempre idempotente; edições usam *last-write-wins* com `updated_at` + `version` (incremento otimista). Se a versão divergir, a UI mostra "Este corte fue editado en otro dispositivo" com as duas versões (raro no MVP, que é monousuário).

---

### Jornada 3: Apontamento diário da equipe e adelantos

1. **Produção** → aba "Hoy": grade de **cards de pessoas** (avatar com iniciais + nome), cada card com alvo ≥ 48px.
2. Toca na pessoa → **seleciona o lote** (os em produção) → **seleciona a operação/máquina** (Recta · Overlock · Collareta · Interlock · Remate/Otro, configuráveis) → **stepper grande** (+1, +10, +50, ou digitação) → Salvar. O valor da operação por peça vem da configuração do lote (ex.: overlock R$ 0,40); se não houver, pergunta uma vez e lembra.
3. **Adelanto:** botão "Dar adelanto / Dar vale" no card → valor + motivo opcional → salvo (offline também).
4. **Fechar acerto** (semanal ou quinzenal, configurável; padrão sábado — decisão A9):
   - Para cada pessoa: Σ(peças × valor da operação) − Σ adelantos − descontos de arreglo (opcional) = **a pagar**.
   - **Alerta CLT art. 78**: `valor_por_dia = bruto ÷ dias_com_apontamento`; se `< salario_minimo_mensal ÷ 30` → aviso educativo (não bloqueia). Parâmetro em `legal_params` com data de vigência (**valor a confirmar via leis-mcp**).
   - **Alerta de jornada** se houver horas registradas acima do limite configurado (hipótese, definir com advogado).
   - Gera `settlements` (imutável depois de "Pagado") + **recibo bilíngue** `/r/[token]` e botão "Enviar por WhatsApp" (mensagem só com os dados da pessoa).

```mermaid
stateDiagram-v2
  [*] --> draft: abrir período
  draft --> review: Calcular acerto
  review --> draft: corrigir apontamento
  review --> paid: Marcar como pagado
  paid --> [*]
  note right of review
    alerta CLT art.78 se valor/dia menor que piso diário
    alerta jornada se horas acima do limite
  end note
```

---

### Jornada 4: Entrega e prova anti-calote

1. No lote → **"Registrar entrega"**: quantidade entregue (parcial permitido), grade entregue, fotos (1–5), observação, valor = qtde × preço − descontos.
2. O servidor cria o `delivery_proofs` com um **snapshot JSON canônico** + `content_sha256` + `public_token` (128 bits, base64url) e cria o `receivables` com status `awaiting_confirmation`.
3. Botão **"Enviar al cliente por WhatsApp"** → `wa.me/<tel>?text=` com a mensagem bilíngue + link.
4. O contratante abre `/{locale}/c/[token]` (sem login):
   - O servidor registra `viewed_at` na primeira vez + log (IP, UA).
   - Vê: nome do taller, referência, fotos, grade, quantidades, valor, prazo, código de verificação (8 primeiros caracteres do hash), selo **"Recibo Não Fiscal"**.
   - Ações: **"Confirmo el recibimiento / Confirmo o recebimento"** (nome + checkbox) **ou** **"Recibí con diferencia / Recebi com divergência"** (quantidade real + comentário).
   - Ao confirmar: grava `confirmed_at`, `confirmed_name`, `confirmed_ip`, `confirmed_user_agent` e trava o snapshot (trigger). O recebível passa para `open` (a receber).
5. Painel do taller: "✅ Confirmado por Carlos el 14/11 a las 10:32 (hora de Brasília)".

```mermaid
sequenceDiagram
  actor T as Taller
  participant App
  participant DB as Neon
  actor C as Contratante (WhatsApp)
  participant Pub as /c/token
  T->>App: Registrar entrega (qtde, fotos)
  App->>DB: insert delivery_proofs + receivables(awaiting_confirmation)
  App-->>T: link + mensagem WhatsApp
  T->>C: envia por wa.me
  C->>Pub: abre link (sem login)
  Pub->>DB: viewed_at + access_audit_logs(ip, ua)
  alt confirma
    C->>Pub: nome + checkbox + Confirmo
    Pub->>DB: confirmed_* + lock snapshot, receivable para open
  else divergência
    C->>Pub: qtde recebida + comentário
    Pub->>DB: disputed_*, receivable para disputed
  end
  DB-->>App: revalidate status atualizado
```

**Segurança do link público:** `robots: noindex`, `Referrer-Policy: no-referrer`, rate limit por IP + token, token revogável ("Anular link"), nada de dado de costureiro, e expiração **opcional** (padrão: não expira, porque é prova).

---

### Jornada 5: Cobrança e fluxo de caixa

1. **Cobros** → topo com o total "Me deben R$ 4.320" + barras por faixa de atraso (0–7 · 8–15 · 16–30 · 30+ dias).
2. Lista por contratante, ordenada por **dias em aberto** (desc). Cada item: valor em aberto, dias, status da prova (visto/confirmado/divergência).
3. **"Cobrar por WhatsApp"** → mensagem pronta (tom educado e firme, escolha entre ES e PT conforme o idioma do contratante) + link `/c/[token]` (que já mostra o Pix) + **Pix Copia e Cola**.
4. **Pix BR Code estático com valor** gerado em `lib/pix-brcode.ts` (EMV MPM: `00` payload format, `26` merchant account `br.gov.bcb.pix` + chave, `52` MCC `0000`, `53` `986`, `54` valor, `58` `BR`, `59` nome, `60` cidade, `62` txid, `63` CRC16-CCITT). QR via biblioteca (ex.: `qrcode`).
5. **Baixa:** "Registrar pago" → valor (total ou parcial) + data + meio (Pix/dinheiro/outro) → `payments`. O recebível vira `partially_paid` ou `paid`. No link público, o botão "Ya pagué / Já paguei" só **notifica** o taller (não dá baixa).

```mermaid
stateDiagram-v2
  [*] --> awaiting_confirmation: entrega registrada
  awaiting_confirmation --> open: contratante confirma
  awaiting_confirmation --> disputed: divergência
  awaiting_confirmation --> open: taller assume sem confirmação após X dias
  disputed --> open: acordo nova versão da prova
  open --> partially_paid: baixa parcial
  partially_paid --> paid: saldo zerado
  open --> paid: baixa total
  open --> written_off: dar por perdido
  paid --> [*]
```

---

### Jornada 6: Calculadora de preço justo por peça

1. **Calculadora** (acessível também sem login, na landing, como isca de aquisição — decisão A13).
2. Perfil da oficina (salvo): custo fixo mensal, pessoas, horas/dia, dias/mês, folha estimada.
3. Entrada rápida: **peças por hora** OU **minutos por peça** (toggle) + preço oferecido + quantidade do lote.
4. Saída ao vivo (cálculo no cliente, em centavos): custo por minuto, custo por peça, **preço mínimo saudável** (custo + margem alvo configurável, padrão 20%: hipótese), lucro/prejuízo do lote, **peças por hora para empatar**. Fórmulas na Inovação 5 (seção 1.7).
5. CTA: "Aceptar este corte → crear lote con este precio".

---

### Jornada 7: Assinatura SaaS de R$ 35/mês com AbacatePay v2

Setup, checkout e verificação do webhook: seção 2.7. Aqui entra a máquina de estados, o cancelamento e o modo leitura.

```mermaid
stateDiagram-v2
  [*] --> free: cadastro 3 lotes grátis
  free --> pending_checkout: abre paywall
  pending_checkout --> active: subscription.completed
  pending_checkout --> trialing: subscription.trial_started só cartão
  trialing --> active: subscription.renewed
  active --> active: subscription.renewed novo período
  active --> past_due: subscription.payment_failed
  past_due --> active: subscription.renewed
  past_due --> read_only: retries esgotados ou período vencido
  active --> canceled: subscription.cancelled acesso até o fim do período pago
  canceled --> read_only: fim do período
  free --> read_only: passou do limite sem assinar
  read_only --> pending_checkout: Renovar
```

**Cancelamento self-service (Decreto 7.962/2013):** "Cuenta" → "Cancelar suscripción" → confirmação única → `POST /subscriptions/cancel` → status `canceled` com acesso até o fim do período. Nos primeiros 7 dias após a 1ª cobrança aparece também **"Cancelar y pedir reembolso (7 días, CDC art. 49)"**, que abre o fluxo de reembolso (seção 1.9, item 4). Depois envia e-mail de confirmação.

**Modo leitura (`read_only`):** o taller **vê tudo, exporta (CSV/JSON/PDF) e abre/compartilha os links de prova já emitidos**, mas não cria lotes, entregas nem acertos novos. **Nunca sequestrar os dados.** Os links públicos `/c/` continuam funcionando (são prova do taller). Decisão A11: no modo leitura, **"Registrar pago" de dívidas antigas permanece liberado** (é baixa do que já existe, não trabalho novo).

---

### 3.2 Os 5 estados obrigatórios de cada tela (com microcopy real)

Toda tela precisa implementar os cinco estados abaixo. Os textos são canônicos: use-os em `src/messages/{es.json,pt-BR.json}`.

| Tela | Vazio | Carregando | Erro | Sucesso | Limite / Permissão |
|---|---|---|---|---|---|
| **Hoy / Hoje** (dashboard) | ES: "Todavía no hay cortes. Registre el primero en 20 segundos." [+ Nuevo corte] · PT: "Ainda não há cortes. Registre o primeiro em 20 segundos." [+ Novo corte] | Skeleton dos 3 cards (Me deben · En producción · Pago del sábado), sem spinner de tela inteira | ES: "No pudimos cargar sus datos. Lo que guardó en el celular está seguro." [Reintentar] · PT: "Não conseguimos carregar seus dados. O que você salvou no celular está seguro." [Tentar de novo] | Cards com números + "3 pendientes de sincronizar" se houver | ES: "Su suscripción venció. Puede ver y exportar todo. Para registrar nuevos cortes, renueve." [Renovar R$ 35] · PT: "Sua assinatura venceu. Você pode ver e exportar tudo. Para registrar novos cortes, renove." [Renovar R$ 35] |
| **Nuevo corte / Novo corte** | Form limpo com dica: ES "Toque 🎤 y diga la cantidad" · PT "Toque 🎤 e diga a quantidade" | Botão "Guardando…" desabilitado; o upload da foto mostra progresso | Validação inline: ES "La grade suma 280, pero la cantidad es 300." · PT "A grade soma 280, mas a quantidade é 300." · Voz: ES "No entendimos. Escriba el número." · PT "Não entendemos. Digite o número." | Online: ES "Corte guardado ✔" · PT "Corte salvo ✔". Offline: ES "Guardado en el celular. Se enviará cuando vuelva la señal." · PT "Salvo no celular. Será enviado quando o sinal voltar." | Freemium esgotado: ES "Usó sus 3 cortes gratis. Active su plan para seguir registrando." · PT "Você usou seus 3 cortes grátis. Ative seu plano para continuar registrando." |
| **Producción & Acerto / Produção & Acerto** | ES: "Agregue a su equipo para anotar la producción." [+ Persona] · PT: "Adicione sua equipe para anotar a produção." [+ Pessoa] | Skeleton dos cards de pessoas | ES: "No se pudo calcular el pago. Revise los registros de hoy." · PT: "Não foi possível calcular o acerto. Confira os registros de hoje." | ES: "Pago de Juan: R$ 420 (producción R$ 520 − adelantos R$ 100). Enviar por WhatsApp" · PT: "Acerto do Juan: R$ 420 (produção R$ 520 − vales R$ 100). Enviar pelo WhatsApp" + **alerta CLT 78** quando aplicável (textos canônicos na Inovação 4) | Acerto `paid` é imutável: ES "Este pago ya fue cerrado. Para corregir, cree un ajuste." · PT "Este acerto já foi fechado. Para corrigir, crie um ajuste." |
| **Cobros / Cobranças** (entregas e recebíveis) | ES: "Nadie le debe nada. 🎉 Cuando entregue un corte, aparecerá aquí." · PT: "Ninguém te deve nada. 🎉 Quando você entregar um corte, ele aparece aqui." | Skeleton da lista + total | ES: "No pudimos generar el Pix. Revise su llave Pix en Cuenta." · PT: "Não conseguimos gerar o Pix. Confira sua chave Pix em Conta." | ES: "Cobro enviado a Carlos. Le deben R$ 900 hace 12 días." · PT: "Cobrança enviada ao Carlos. Ele te deve R$ 900 há 12 dias." / "Pago registrado ✔" | Modo leitura: os links continuam visíveis e compartilháveis; "Registrar pago" fica liberado (decisão A11) |
| **Link público `/c/[token]`** (contratante) | — (sempre tem dados) | Página SSR estática por token (sem skeleton longo) | Token inválido ou anulado: ES "Este comprobante no existe o fue anulado por el taller." · PT "Este comprovante não existe ou foi anulado pelo taller." | ES: "Gracias, Carlos. Recibimiento confirmado el 14/11/2026 a las 10:32 (hora de Brasília)." · PT: "Obrigado, Carlos. Recebimento confirmado em 14/11/2026 às 10:32 (horário de Brasília)." | Já confirmado: mostra a confirmação, **sem** reabrir; rate limit: ES "Demasiados intentos. Intente en unos minutos." · PT "Muitas tentativas. Tente em alguns minutos." |
| **Calculadora** | Valores de exemplo editáveis + ES "Complete el costo de su taller una vez y se guarda." · PT "Preencha o custo do seu taller uma vez e ele fica salvo." | Instantâneo (cálculo no cliente) | ES: "Horas por día debe ser mayor que 0." · PT: "Horas por dia precisa ser maior que 0." | Verde: ES "Este corte da ganancia de R$ 240." · PT "Este corte dá lucro de R$ 240." Vermelho: ES "Da pérdida de R$ 180. Necesita R$ 0,60 más por pieza o 14 piezas/hora para empatar." · PT "Dá prejuízo de R$ 180. Você precisa de R$ 0,60 a mais por peça ou de 14 peças/hora para empatar." | Sem login: funciona; "Guardar perfil" pede cadastro |
| **Cuenta: Suscripción & Legal/LGPD / Conta: Assinatura & Legal/LGPD** | Free: ES "Plan gratis: 1 de 3 cortes usados." · PT "Plano grátis: 1 de 3 cortes usados." | Skeleton; "Abriendo pago seguro…" / "Abrindo pagamento seguro…" | ES: "El pago no se completó. No se cobró nada. Intente de nuevo o elija otro medio." · PT: "O pagamento não foi concluído. Nada foi cobrado. Tente de novo ou escolha outro meio." / `past_due`: ES "No pudimos cobrar la mensualidad. Reintentaremos en 2 días." · PT "Não conseguimos cobrar a mensalidade. Vamos tentar de novo em 2 dias." | ES: "¡Plan activo! Próximo cobro: R$ 35 el 13/12." · PT: "Plano ativo! Próxima cobrança: R$ 35 em 13/12." / Exportação: ES "Sus datos están listos (CSV/JSON)." · PT "Seus dados estão prontos (CSV/JSON)." / Cancelado: ES "Suscripción cancelada. Tiene acceso hasta 13/12." · PT "Assinatura cancelada. Você tem acesso até 13/12." | Excluir conta: confirmação dupla digitando o nome do taller; ES "Esto borra sus datos en hasta 30 días, excepto lo que la ley obliga a guardar (registros de acceso por 6 meses)." · PT "Isso apaga seus dados em até 30 dias, exceto o que a lei obriga a guardar (registros de acesso por 6 meses)." ⚠️ Prazo de 30 dias: decisão A10, a validar |

### 3.3 Mensagens de WhatsApp (templates)

- **Prova de entrega (PT):** "Olá, Carlos! Aqui é o Taller Rosa. Entregamos hoje 300 peças da ref. 1234 (P 80 · M 120 · G 100). Valor: R$ 900,00. Por favor, confirme o recebimento neste link: {url}. Obrigado!"
- **Prova de entrega (ES):** "¡Hola, Carlos! Le escribe Taller Rosa. Hoy entregamos 300 piezas de la ref. 1234 (P 80 · M 120 · G 100). Valor: R$ 900,00. Por favor, confirme el recibimiento en este enlace: {url}. ¡Gracias!"
- **Cobrança (PT):** "Olá, Carlos! Passando para lembrar do pagamento de R$ 900,00 da entrega de 02/11 (há 12 dias). Pix copia e cola: {pix}. Comprovante: {url}."
- **Recibo do costureiro (ES):** "Juan, su pago de la semana: producción R$ 520 − adelantos R$ 100 = R$ 420. Detalle: {url}"

(Completar o par que faltar no mesmo tom: cobrança em ES e recibo do costureiro em PT, sempre no singular, educado e firme, sem acusar ninguém. Validar o tom nas entrevistas — item D4.)


---

## 4. Schema de Banco de Dados Completo e Regras de Negócio/Integridade

Neon Postgres + Drizzle ORM (`drizzle-orm/neon-http`). Migrações: `pnpm drizzle-kit generate` → revisão → `pnpm drizzle-kit migrate` usando `DATABASE_URL_UNPOOLED`. Um **branch do Neon por PR/preview**.

### 4.1 Diagrama ER

```mermaid
erDiagram
  users ||--o{ workshop_members : "pertence"
  workshops ||--o{ workshop_members : "tem"
  workshops ||--o{ clients : "atende"
  workshops ||--o{ workers : "emprega/contrata"
  workshops ||--o{ batches : "recebe"
  clients ||--o{ batches : "envia"
  batches ||--o{ batch_operations : "preço por operação"
  batches ||--o{ production_logs : "apontado em"
  workers ||--o{ production_logs : "produz"
  workers ||--o{ advances : "recebe"
  workers ||--o{ settlements : "acerta"
  settlements ||--o{ settlement_items : "detalha"
  batches ||--o{ delivery_proofs : "entregue em"
  delivery_proofs ||--|| receivables : "gera"
  clients ||--o{ receivables : "deve"
  receivables ||--o{ payments : "baixas"
  workshops ||--o| subscriptions : "assina"
  subscriptions ||--o{ billing_webhook_events : "eventos"
  workshops ||--o{ access_audit_logs : "logs"
  workshops ||--o{ offline_sync_queue : "mutações"
  workshops ||--o{ media_assets : "fotos"
  users ||--o{ legal_acceptances : "aceita"

  users {
    text id PK "Better Auth"
    text email
    text name
    text locale
    timestamptz created_at
  }
  workshops {
    uuid id PK
    text name
    text city
    text district
    smallint machine_count
    text doc_type "cpf|rnm|cnpj|null"
    text doc_number_enc
    text pix_key_type
    text pix_key
    text pix_merchant_name
    text pix_city
    text default_locale
    text plan_status "free|trialing|active|past_due|canceled|read_only"
    smallint free_batches_used
    timestamptz deleted_at
  }
  workshop_members {
    uuid workshop_id FK
    text user_id FK
    text role "owner|helper"
  }
  clients {
    uuid id PK
    uuid workshop_id FK
    text name
    text phone_e164
    text preferred_locale
    text notes
    timestamptz anonymized_at
  }
  workers {
    uuid id PK
    uuid workshop_id FK
    text name
    text phone_e164
    text doc_type
    text doc_number_enc
    boolean is_employee "para alerta CLT 78"
    boolean active
    timestamptz anonymized_at
  }
  batches {
    uuid id PK
    uuid workshop_id FK
    uuid client_id FK
    text reference
    integer quantity
    jsonb size_grid
    text color
    integer unit_price_cents
    integer total_cents
    date due_date
    text supplies_by "client|workshop"
    text status "received|in_production|ready|delivered|closed|canceled"
    uuid_array photo_ids
    integer version
    uuid client_mutation_id
  }
  batch_operations {
    uuid id PK
    uuid workshop_id FK
    uuid batch_id FK
    text machine "recta|overlock|collareta|interlock|other"
    text label
    integer piece_rate_cents
  }
  production_logs {
    uuid id PK
    uuid workshop_id FK
    uuid batch_id FK
    uuid worker_id FK
    uuid operation_id FK
    date work_date
    integer pieces
    numeric hours "opcional"
    integer amount_cents
    uuid client_mutation_id
  }
  advances {
    uuid id PK
    uuid workshop_id FK
    uuid worker_id FK
    integer amount_cents
    date given_on
    text reason
    uuid settlement_id FK
    uuid client_mutation_id
  }
  settlements {
    uuid id PK
    uuid workshop_id FK
    uuid worker_id FK
    date period_start
    date period_end
    integer gross_cents
    integer advances_cents
    integer adjustments_cents
    integer net_cents
    integer days_worked
    boolean below_min_wage_flag
    text status "draft|review|paid"
    text public_token
    timestamptz paid_at
  }
  settlement_items {
    uuid id PK
    uuid settlement_id FK
    uuid production_log_id FK
    integer amount_cents
  }
  delivery_proofs {
    uuid id PK
    uuid workshop_id FK
    uuid batch_id FK
    integer version
    integer quantity
    jsonb size_grid
    integer amount_cents
    uuid_array photo_ids
    jsonb snapshot
    text content_sha256
    text public_token "unique"
    timestamptz viewed_at
    inet viewed_ip
    timestamptz confirmed_at
    text confirmed_name
    inet confirmed_ip
    text confirmed_user_agent
    timestamptz disputed_at
    integer disputed_quantity
    text disputed_comment
    timestamptz revoked_at
  }
  receivables {
    uuid id PK
    uuid workshop_id FK
    uuid client_id FK
    uuid delivery_proof_id FK
    integer amount_cents
    integer paid_cents
    date issued_on
    date due_on
    text status "awaiting_confirmation|open|disputed|partially_paid|paid|written_off"
  }
  payments {
    uuid id PK
    uuid workshop_id FK
    uuid receivable_id FK
    integer amount_cents
    date paid_on
    text method "pix|cash|other"
    text note
    uuid client_mutation_id
  }
  subscriptions {
    uuid id PK
    uuid workshop_id FK
    text abacate_customer_id
    text abacate_subscription_id "subs_"
    text abacate_checkout_id "bill_"
    text method "PIX|CARD"
    text status
    timestamptz current_period_end
    timestamptz trial_ends_at
    timestamptz canceled_at
    timestamptz refund_requested_at
  }
  billing_webhook_events {
    text id PK "log_ idempotencia"
    text type
    jsonb payload
    timestamptz received_at
    timestamptz processed_at
    text error
  }
  access_audit_logs {
    bigint id PK
    uuid workshop_id FK
    text user_id
    text actor "user|public|system"
    text event
    inet ip
    integer source_port
    text user_agent
    text resource
    timestamptz occurred_at "UTC"
  }
  offline_sync_queue {
    uuid client_mutation_id PK
    uuid workshop_id FK
    text user_id
    text entity
    text op "create|update|delete"
    text server_entity_id
    text status "applied|duplicate|rejected"
    text error
    timestamptz client_created_at
    timestamptz received_at
  }
  media_assets {
    uuid id PK
    uuid workshop_id FK
    text storage_key
    text mime
    integer bytes
    integer width
    integer height
    boolean exif_stripped
    timestamptz deleted_at
  }
  legal_acceptances {
    uuid id PK
    text user_id FK
    text document "terms|privacy|no_forced_labor"
    text version
    text locale
    inet ip
    timestamptz accepted_at
  }
```

Tabelas auxiliares: `legal_params` (`key`, `value_cents`, `valid_from`; ex.: `minimum_wage_monthly_cents`) e `workshop_settings` (perfil da calculadora, dia do acerto, limite de horas). Tabelas do Better Auth: `user`, `session`, `account`, `verification` (geradas pelo CLI; mapear `users` = `user`).

Documentos legais versionados: `legal_documents.version` (Termos, Privacidade, DPA), referenciados em `legal_acceptances`.

### 4.2 Exemplo Drizzle (padrões obrigatórios)

```ts
// src/db/schema.ts (trecho)
import { pgTable, uuid, text, integer, jsonb, date, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const batches = pgTable('batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  workshopId: uuid('workshop_id').notNull().references(() => workshops.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').references(() => clients.id),
  reference: text('reference'),
  quantity: integer('quantity').notNull(),
  sizeGrid: jsonb('size_grid').$type<Record<string, number>>(),
  unitPriceCents: integer('unit_price_cents').notNull(),     // centavos inteiros
  totalCents: integer('total_cents').notNull(),
  dueDate: date('due_date'),
  status: text('status', { enum: ['received','in_production','ready','delivered','closed','canceled'] }).notNull().default('received'),
  version: integer('version').notNull().default(1),
  clientMutationId: uuid('client_mutation_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('batches_ws_status_due_idx').on(t.workshopId, t.status, t.dueDate),
  index('batches_ws_client_idx').on(t.workshopId, t.clientId),
  uniqueIndex('batches_ws_cmid_uq').on(t.workshopId, t.clientMutationId),
]);
```

`tenantDb(workshopId)` envolve as consultas e injeta `eq(table.workshopId, wsId)`.

### 4.3 Índices compostos essenciais

| Tabela | Índice | Uso |
|---|---|---|
| `receivables` | `(workshop_id, status, issued_on)` | Painel "quem me deve e há quantos dias" |
| `production_logs` | `(workshop_id, worker_id, work_date)` | Acerto semanal |
| `advances` | `(workshop_id, worker_id, settlement_id)` | Adelantos em aberto |
| `delivery_proofs` | `UNIQUE(public_token)`, `(workshop_id, batch_id, version)` | Link público e histórico |
| `access_audit_logs` | `(occurred_at)` (BRIN) + `(workshop_id, occurred_at)` | Retenção e consulta |
| `offline_sync_queue` | PK `client_mutation_id` | Idempotência |
| `billing_webhook_events` | PK `id` (`log_…`) | Idempotência |
| Todas as tabelas com `client_mutation_id` | `UNIQUE(workshop_id, client_mutation_id)` | Dupla proteção contra duplicata |

### 4.4 Regras de negócio e integridade (críticas)

**Centavos inteiros.** Todos os campos monetários são `integer` `*_cents` (`3500` = R$ 35,00). Um `integer` de 32 bits comporta até ~R$ 21 milhões por campo, o que basta para o MVP; usar `bigint` nos agregados se necessário. Formatação só na borda com `Intl.NumberFormat`. Testes de propriedade (`fast-check`) para somas de acerto.

**Multi-tenant.** Toda query de negócio passa por `tenantDb(workshopId)`. Toda tabela de negócio tem `workshop_id NOT NULL` + índice composto que começa por `workshop_id`. Teste automatizado tenta ler dados de outra oficina e precisa falhar. Proibido usar `db` cru fora de `src/db/tenant.ts` (lint/grep no CI). RLS no Postgres fica para a v1.1.

**Datas.** Persistência em `timestamptz` (UTC); exibição em `America/Sao_Paulo`.

**Idempotência.** Toda mutação da fila offline carrega `client_mutation_id` (UUID v7). O servidor consulta `offline_sync_queue` antes de aplicar e devolve `{status: duplicate, serverId}` se já processada. Toda tabela com `client_mutation_id` tem `UNIQUE(workshop_id, client_mutation_id)`. Webhooks usam PK `billing_webhook_events.id` (`log_…`) com `onConflictDoNothing`.

**Imutabilidade de `delivery_proofs`.** Trigger `BEFORE UPDATE ON delivery_proofs` impede mudar `snapshot`, `content_sha256`, `quantity` e `amount_cents` quando `confirmed_at IS NOT NULL`. Correções viram `version + 1` (a versão anterior permanece no histórico). O `content_sha256` é calculado sobre o JSON canônico no momento da geração do link e aparece no rodapé do recibo (código de verificação = 8 primeiros caracteres do hash).

**Imutabilidade do acerto.** Depois de `settlements.status = 'paid'`, o registro não é editado. Correção vira um ajuste novo (microcopy na seção 3.2).

**Pix BR Code (EMV MPM + CRC16).** Gerado em `lib/pix-brcode.ts` a partir da chave Pix do taller, sem API de banco:

- `00` payload format
- `26` merchant account `br.gov.bcb.pix` + chave
- `52` MCC `0000`
- `53` `986` (BRL)
- `54` valor
- `58` `BR`
- `59` nome do recebedor (`pix_merchant_name`)
- `60` cidade (`pix_city`)
- `62` txid
- `63` CRC16-CCITT

QR via biblioteca (ex.: `qrcode`). Testes unitários do CRC16 contra vetores conhecidos. QR dinâmico (API do PSP do taller) fica **fora do MVP**.

**Criptografia de CPF/RNM.** Campo `doc_number_enc`: criptografado na aplicação com **AES-256-GCM**, chave `DATA_ENCRYPTION_KEY` (32 bytes em base64, `openssl rand -base64 32`). Na UI, exibir só os **3 últimos dígitos**. Documentos dos costureiros são **opcionais**. Não guardar foto de documento. Validação: CPF com dígito verificador; RNM por formato; ambos opcionais para os costureiros.

**Anonimização LGPD.** Exclusão de um costureiro ou contratante: nome → `"Trabajador #123"` (ou equivalente para cliente), telefone/documento → `null`, `anonymized_at` preenchido. Isso **mantém a integridade contábil** dos lotes e acertos. Recibo do costureiro mostra **só os dados da própria pessoa**, nunca os da equipe.

**Exclusão de conta.** Soft-delete imediato (`workshops.deleted_at`) + job de hard-delete em até **30 dias** (decisão A10, prazo a validar), **exceto `access_audit_logs`**, guardados pelo menos **6 meses** (Marco Civil art. 15), com sugestão de purge em 6 meses + 30 dias. Confirmação dupla digitando o nome do taller.

**Exportação (LGPD art. 18).** ZIP com CSV por tabela + JSON + PDFs dos recibos, em ≤ 1 min, acionado em Configurações ("Exportar mis datos").

**Fotos.** Compressão no cliente (WebP, lado maior ~1600px), remoção de EXIF/GPS (`media_assets.exif_stripped`), chave de storage aleatória, acesso por URL assinada de curta duração no app; no link público, URLs assinadas geradas a cada render.

**Máquinas de estado (resumo dos enums).**

- `batches.status`: `received` → `in_production` → `ready` → `delivered` → `closed` | `canceled`
- `settlements.status`: `draft` → `review` → `paid` (imutável)
- `receivables.status`: `awaiting_confirmation` → `open` | `disputed` → `partially_paid` | `paid` | `written_off` (detalhe na Jornada 5)
- `workshops.plan_status` / assinatura: `free` → `pending_checkout` → `trialing` | `active` → `past_due` | `canceled` → `read_only` (detalhe na Jornada 7)


---

## 5. Compliance Legal Brasil (L1–L19)

> Os artigos abaixo vêm da pesquisa de 13/11/2026. ⚠️ Os textos do Planalto **não foram abertos na sessão de pesquisa**: o Claude deve **confirmar cada artigo** com `leis-mcp` (`ler_artigo`) antes de escrever termos, política e microcopy legal, e citar a `fonte`. O `brasil-legal-skills` é educativo e exige um rodapé de atribuição nas respostas dele: usar como orientação, **não** como texto oficial, e **não deixar o rodapé vazar para a UI**.
>
> Isto é um mapa de implementação, não um parecer jurídico. Validar com advogado e contador antes do go-live (item D5).

### 5.1 Checklist técnico-jurídico (L1–L19)

| # | Obrigação | Base legal | Implementação no produto | Critério de aceite |
|---|---|---|---|---|
| L1 | Papéis LGPD: **operador** dos dados que a oficina lança (costureiros, contratantes) e **controlador** dos dados de conta e cobrança | LGPD (Lei 13.709/2018). Texto: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm · acervo ctresb: https://raw.githubusercontent.com/ctresb/leis/main/federal/leis-ordinarias/2018/lei-13709-2018-08-14.md | Termos de Uso + DPA simplificado (cláusula de operador) + Política de Privacidade separando os dois papéis | Os documentos existem em ES e PT-BR, versionados (`legal_documents.version`) e com aceite registrado |
| L2 | Política de privacidade **bilíngue**, clara e curta + versão completa | LGPD | `/[locale]/privacidad`, com resumo em 5 tópicos no topo | Link no rodapé, no cadastro e no link público |
| L3 | **Encarregado (DPO)** identificado com contato | LGPD | Nome + e-mail do DPO na política e no rodapé | Campo preenchido (input B6, em `src/config/legal.ts`) |
| L4 | **Direitos do titular** (art. 18): acesso, correção, exclusão, portabilidade | LGPD art. 18 | Botões "Exportar mis datos (JSON/CSV)" e "Eliminar cuenta" em Configurações; exclusão de um costureiro com anonimização (`name → "Trabajador #123"`, CPF/RNM → null) | Exportação em ≤ 1 min; exclusão com confirmação dupla; log em `access_audit_logs` |
| L5 | Minimização e segurança | LGPD | Documentos dos costureiros opcionais; não guardar foto de documento; remover EXIF/GPS das fotos; TLS; segredos em variáveis de ambiente; acesso por `workshopId`; CPF/RNM com AES-256-GCM | Testes de isolamento multi-tenant passam |
| L6 | **Guarda de registros de acesso por 6 meses**, em sigilo | Marco Civil art. 15 (Lei 12.965/2014). Texto: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm | Tabela `access_audit_logs` (IP, porta de origem se disponível, timestamp UTC, evento, user/workshop). Exibir em America/Sao_Paulo; purge por cron **depois** de 6 meses (sugestão: 6 meses + 30 dias). Eventos: `auth.login`, `auth.logout`, `public_proof.view`, `public_proof.confirm`, `public_proof.dispute`, `data.export`, `account.delete`, `subscription.*` | Todo login, link público aberto/confirmado, exportação e exclusão gera log; um job de retenção roda diariamente |
| L7 | Preço e recorrência claros | CDC (Lei 8.078/1990). Texto: https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm | Paywall e checkout mostram "R$ 35,00 por mês, renovação automática, cancele quando quiser" | Texto visível antes do pagamento |
| L8 | **Arrependimento em 7 dias** com devolução integral | CDC art. 49 | Botão "Cancelar y pedir reembolso" disponível por 7 dias após a 1ª cobrança; fluxo de reembolso (API da AbacatePay, se existir, ou Pix de devolução manual com SLA ≤ 7 dias — ⚠️ endpoint **não verificado**) | SLA de reembolso registrado; e-mail de confirmação |
| L9 | Identificação da empresa no site (razão social, CNPJ, endereço, contato) | Decreto 7.962/2013, art. 2º. Texto: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm | Rodapé de todas as páginas públicas + página "Quem somos / Quiénes somos" | Dados do Grupo B preenchidos em `src/config/legal.ts` |
| L10 | Resumo do contrato antes da contratação + confirmação imediata | Decreto 7.962/2013, art. 4º | Tela de resumo antes do checkout; e-mail de confirmação após `subscription.completed` | |
| L11 | **Cancelamento pelo mesmo meio da contratação** | Decreto 7.962/2013, arts. 4º e 5º | Botão "Cancelar assinatura" no próprio painel → `POST /subscriptions/cancel` na AbacatePay | Cancelamento em ≤ 3 toques, sem precisar falar com ninguém |
| L12 | Atendimento eletrônico com resposta em até 5 dias | Decreto 7.962/2013 | E-mail de suporte + formulário; SLA na página | Canal publicado |
| L13 | Taller MEI de facção: CNAE **1412-6/03** (exceto roupas íntimas), 1411-8/02 (íntimas) e 1413-4/03 (profissionais) | LC 123 (Anexo XI), Res. CGSN 140/2018. Teto de R$ 81 mil/ano (LC 123, art. 18-A). O MEI **não pode ceder mão de obra** (Res. CGSN 140/2018, art. 112), e a existência de vínculo empregatício pode excluir do Simples (art. 114). O enquadramento Anexo II ou III do Simples depende do contrato. Na nota de remessa/retorno para industrialização, quem envia o material emite a NF-e de remessa | Campo opcional "CNPJ/MEI"; dica educativa sobre os CNAEs; alerta: "O MEI não pode ceder mão de obra (Res. CGSN 140, art. 112)" | Cadastro **não trava** sem CNPJ |
| L14 | Aceitar **CPF ou RNM/CRNM**, sem exigir CNPJ | Lei de Migração 13.445/2017 (acesso igual a direitos; o Acordo de Residência do Mercosul se aplica à Bolívia). ⚠️ Não aprofundado na sessão de pesquisa | Validação de CPF (dígito verificador) e de RNM (formato), ambos opcionais para os costureiros | |
| L15 | **Não emitir nota fiscal**: "Recibo Não Fiscal" | Emissor Nacional NFS-e (gov.br): https://www.gov.br/pt-br/servicos/emitir-nota-fiscal-de-servico-eletronica · FAQ v1.3 (06/11/2026): https://www.gov.br/nfse/pt-br/perguntas-frequentes/perguntas-frequentes-nfs-e-v1-3-20261106.pdf. Para a facção, ISS (NFS-e) ou ICMS (NF-e de retorno de industrialização) depende do caso | Todo PDF/recibo traz "RECIBO NÃO FISCAL / COMPROBANTE NO FISCAL" + "Para nota fiscal, use o Emissor Nacional NFS-e (gov.br) ou fale com seu contador" | Texto presente em 100% dos recibos |
| L16 | **CLT art. 78**: piso diário do salário mínimo para empregado que recebe por peça | CLT (DL 5.452/1943). Texto: https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm | Alerta educativo no acerto (Inovação 4); parâmetro `minimum_wage_monthly_cents` com vigência (confirmar o decreto vigente via `leis-mcp`; piso diário = mensal ÷ 30, regra a confirmar com o contador) | Teste unitário do cálculo do piso |
| L17 | Autonomia de facção (sem exclusividade e sem ingerência) | Jurisprudência do TST: em geral o contrato de facção **não é terceirização** quando há entrega de produto acabado, autonomia da oficina, **ausência de exclusividade e de ingerência** da contratante — nesse caso não há responsabilidade subsidiária; com exclusividade/ingerência, há risco. (Acórdãos citados na pesquisa: https://jurisprudencia-backend2.tst.jus.br/rest/documentos/a08aca125a711cfcbae4c245897bf4ac e https://jurisprudencia-backend2.tst.jus.br/rest/documentos/509988b00c4682ad764058f136782bae). Lei 13.429/2017 (alterou a Lei 6.019/74): terceirização de qualquer atividade; **art. 5º-A, §5º: responsabilidade subsidiária da contratante** pelas obrigações trabalhistas do período. Texto: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13429.htm. STF, Tema 725 (RE 958.252) / ADPF 324: terceirização da atividade-fim é lícita, e a contratante mantém responsabilidade subsidiária. https://portal.stf.jus.br/jurisprudenciarepercussao/verandamentoprocesso.asp?classeprocesso=re&incidente=4952236&numeroprocesso=958252&numerotema=725 · acórdão no TRT-3: https://portal.trt3.jus.br/internet/jurisprudencia/repercussao-geral-e-controle-concentrado-adi-adc-e-adpf-stf/downloads/repercussao-geral/Acordao_Tema_725_RG_STF.pdf | Histórico multi-contratante exportável; microcopy "ayuda a documentar", nunca "garantiza" | |
| L18 | **Proibição expressa** de trabalho análogo à escravidão | Código Penal, art. 149 (redução a condição análoga à de escravo). Lei paulista 14.946/2013: **cassação da inscrição no ICMS** de quem comercializa produtos fabricados com trabalho análogo à escravidão em qualquer etapa da cadeia. https://legislacao.fazenda.sp.gov.br/Paginas/lei14946.aspx. A ADI 5465 no STF exige processo com ampla defesa e prova de ciência ou indícios: https://www.stf.jus.br/arquivo/cms/noticiaNoticiaStf/anexo/ADI5465informac807a771oa768sociedadetrabalhoescravoSP.pdf | Cláusula nos Termos + aceite no cadastro ("Declaro que no uso este sistema en condiciones de trabajo forzado, jornadas agotadoras o servidumbre por deudas") + canal de denúncia + suspensão da conta diante de indícios | Checkbox obrigatório no onboarding |
| L19 | NFS-e do próprio SaaS (R$ 35/mês) | LC 116, item 1.05 (licenciamento/cessão de software; ⚠️ não aberto na sessão). Em princípio não há retenção quando o cliente é pessoa física ou MEI (validar com o contador). ⚠️ Verificar se essa atividade **cabe no MEI** (muitas atividades de software não constam do Anexo XI) | Processo operacional do Rafael (fora do código): se o SaaS for ME/MEI, emitir NFS-e (Emissor Nacional) da assinatura | Confirmar com o contador antes da 1ª cobrança real |

### 5.2 Como o Claude deve usar as ferramentas jurídicas

Instalação: seção 2.9.

1. `uvx leis-mcp index` (uma vez) e `claude mcp add leis -s project -- uvx leis-mcp serve`.
2. Para cada linha L1–L18: `buscar_norma` → `ler_artigo` → colar o trecho exato num comentário de `docs/legal/fontes.md` com o link oficial e o aviso de vigência.
3. Usar `brasil-legal-skills` para orientação sobre MEI/Simples/CDC/LGPD. O rodapé de atribuição que essa skill exige **não deve vazar para a UI do produto**.
4. Opcional, como segunda checagem: MCP do KivoHub (texto conferido contra o Planalto).
5. Toda saída jurídica fica marcada como **"rascunho, revisar com advogado"** até o Rafael aprovar.
6. Também confirmar via `leis-mcp`, antes de redigir microcopy legal: o valor vigente do salário mínimo (D7); a força probatória do aceite eletrônico simples (MP 2.200-2/2001, art. 10, §2º, não conferida na pesquisa).


---

## 6. Integração Técnica Obrigatória do SeeB + CSP + Acessibilidade Nativa

Script informado pelo Rafael: `<script src="https://seeb-widget.pages.dev/widget.js" defer></script>`.

### 6.1 O que o `widget.js` faz (lido no código, 13/11/2026)

- URL: `https://seeb-widget.pages.dev/widget.js` (HTTP 200, ~54 KB minificado; a raiz do domínio dá **HTTP 404** — não há página inicial). Cópia inspecionada em `/workspace/taller-saas/seeb-widget.js`.
- Origem do logo: `raw.githubusercontent.com/devrafcks/seeb-extension`. O repositório se descreve como extensão open-source de acessibilidade em tempo real (0 estrelas). ⚠️ **A licença do repositório não foi verificada.**
- Registra o Web Component **`<seeb-widget>`** com **Shadow DOM aberto**: botão flutuante arrastável + painel lateral de 340px.
- **Reparentamento:** a função `wrapContent()` roda **uma vez na inicialização** (não há `MutationObserver` no código). Ela cria `<div id="seeb-content-wrapper">` e:
  - se existir `#__next`, `#__nuxt`, `#app`, `[ng-version]` ou uma raiz Angular → **move só esse nó** para dentro do wrapper;
  - senão → **move todos os filhos do `<body>`** (exceto `SCRIPT`, `STYLE`, `LINK`, o próprio `<seeb-widget>` e os nós de filtro/guia) para dentro do wrapper.
- Os filtros (inverter, modo escuro, contraste, daltonismo, brilho) são aplicados **no wrapper**. O leitor de voz lê `wrapper.innerText` (ou a seleção) com `utterance.lang = document.documentElement.lang || "pt-BR"`.
- Preferências em `localStorage["seeb.settings"]`; fonte **Atkinson Hyperlegible** via `@import` do Google Fonts.
- **Sem API de configuração** para o integrador (nenhum atributo `data-*` nem API pública no `<script>`). Posição e cores são escolhidas pelo usuário final no painel e ficam no localStorage. Presets de posição: `top-left|top-center|top-right|left-center|right-center|bottom-left|bottom-center|bottom-right` ou "custom" (arrastar). O padrão é `right-center`. Também guarda as cores do ícone e do painel (`#003667` / `#E6EDF3`).
- **Sem i18n: o painel é só em PT-BR.** A voz respeita `<html lang="es">` e lê em espanhol, mas os rótulos do painel continuam em português.
- Atalhos: Alt+A abrir/fechar · Alt+T ampliar texto · Alt+E espaçamento · Alt+B negrito · Alt+U sublinhar links · **Alt+V leitor de voz (Web Speech API)** · Alt+J realçar foco · Alt+G guia de leitura · Alt+F linha de foco · Alt+C alto contraste · Alt+I inverter cores · Alt+D modo escuro · Alt+H ocultar imagens · Alt+M cursor grande · Alt+K destacar links · Alt+P parar animações · Alt+R redefinir · Alt+1…5 filtros de daltonismo (normal, protanopia, deuteranopia, tritanopia, monocromático). Há também brilho, saturação, redução de transparência, voz feminina/masculina e velocidade.

### 6.2 Riscos no App Router

1. **Hidratação/reconciliação:** no App Router não existe `#__next`. Sem um `#app`, o widget moveria **todos os filhos do `<body>`** que o React controla, o que pode gerar erros de `removeChild`/`insertBefore` (hidratação).
2. **Portais (Radix/shadcn: Dialog, Sheet, Popover, Select, Sonner):** são anexados ao `<body>` **depois** da inicialização. Como o `wrapContent()` roda uma vez só, **eles ficam fora do wrapper**. Na prática, os modais e toasts **não recebem** os filtros de alto contraste, inversão ou daltonismo, e o leitor de voz (que lê o wrapper) **não lê** os modais.
3. **Atalhos Alt+letra** podem colidir com atalhos do próprio app ou do navegador: **não usar Alt+letra no app**.
4. Dependência externa sem versão nem SRI (pages.dev pode mudar a qualquer momento). Para produção, preferir auto-hospedar uma cópia fixada se a licença permitir (item D6).

### 6.3 Estratégia segura (Next 16) — código exato

```tsx
// src/app/[locale]/layout.tsx
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { fontSans, fontDisplay, fontMono } from '@/styles/fonts';
import '@/styles/globals.css'; // @import "tailwindcss"; @import "./tokens.css";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: 'es' | 'pt-BR' }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}
    >
      <body>
        {/* 1. Raiz única e estável: o SeeB move SÓ este nó para #seeb-content-wrapper */}
        <div id="app">
          <NextIntlClientProvider>
            {children}
            {/* 2. Raiz de portais DENTRO de #app: filtros e leitor de voz alcançam modais e toasts */}
            <div id="portal-root" />
          </NextIntlClientProvider>
        </div>
        {/* 3. Carrega depois da hidratação e do load */}
        <Script
          src={process.env.NEXT_PUBLIC_SEEB_WIDGET_URL ?? 'https://seeb-widget.pages.dev/widget.js'}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
```

Regras de implementação obrigatórias:

- Nos wrappers do shadcn (`dialog.tsx`, `sheet.tsx`, `popover.tsx`, `select.tsx`, `dropdown-menu.tsx`), passar `container={document.getElementById('portal-root')}` para o `*Portal` (via um hook `usePortalContainer()` que resolve no cliente). Renderizar o `<Toaster />` (Sonner) **dentro** de `#app`.
- **`lang` dinâmico:** como `<html lang={locale}>` mora no layout `[locale]`, a troca de idioma (navegação para `/es/...` ↔ `/pt-BR/...`) re-renderiza o atributo e o leitor de voz do SeeB passa a ler em espanhol ou português automaticamente (ele lê `documentElement.lang` a cada fala). Usar `es` (genérico) para maximizar as vozes disponíveis no Android. ⚠️ Ressalva medida no código (seção 8.8, item 10): ao escolher a voz, o widget **prefere vozes `pt*`**; com `lang="es"` o texto pode sair com voz portuguesa. Explicar isso na página `/[locale]/accesibilidad`.
- **Nota de UX bilíngue:** o painel do SeeB continua em PT-BR. Mitigações:
  1. Em "Más → Accesibilidad" (ES), uma página curta explica "El panel de accesibilidad está en portugués" e traduz os principais atalhos (Alt+A abrir, Alt+T texto grande, Alt+V leer en voz alta, Alt+C alto contraste).
  2. Tooltip/rótulo próprio próximo da primeira abertura: "Accesibilidad (panel en portugués)".
  3. Como o repositório `devrafcks/seeb-extension` é do Rafael (⚠️ confirmar), a melhor correção é **upstream**: i18n do painel (`es`) lendo `documentElement.lang`, atributos `data-position`/`data-lang` e um `MutationObserver` que inclua os portais no wrapper.
- **Testes obrigatórios (Playwright):** navegação client-side entre as 4 abas; troca de idioma; abrir e fechar Dialog/Sheet/Select com o widget carregado; console sem `Hydration failed`/`NotFoundError`; alto contraste aplicado **dentro** do modal.

### 6.4 Headers de CSP (em `next.config.ts` → `headers()`)

```ts
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://seeb-widget.pages.dev",            // trocar por nonce via proxy.ts no hardening
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",             // o SeeB injeta <style> e @import
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://raw.githubusercontent.com https://*.public.blob.vercel-storage.com", // logo do SeeB + fotos (ajustar ao storage escolhido)
  "connect-src 'self' https://*.public.blob.vercel-storage.com",               // upload/download de fotos
  "media-src 'self' blob:",
  "worker-src 'self' blob:",                                                   // service worker Serwist
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self' https://*.abacatepay.com",                               // ⚠️ conferir o domínio real do checkout (C3.9)
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');
// + Strict-Transport-Security
// + X-Content-Type-Options: nosniff
// + Referrer-Policy: strict-origin-when-cross-origin
//     (no-referrer em /c/* e /r/*)
// + Permissions-Policy: camera=(self), microphone=(self), geolocation=()
```

- Em dev, adicionar `'unsafe-eval'` só no `script-src` (o HMR exige).
- **Se o widget for auto-hospedado**, remover `https://seeb-widget.pages.dev`; se a fonte e o logo também forem auto-hospedados, remover os domínios do Google Fonts e do GitHub.
- Ajustar `img-src` e `connect-src` se a escolha de storage for Cloudflare R2 (C5), não Vercel Blob.

### 6.5 Plano de auto-hospedagem com SRI (só se o Rafael autorizar pela licença — item D6)

1. Confirmar a licença (⚠️ **não verificada**: o repositório tem 0 estrelas e a licença não foi lida).
2. Baixar a versão fixada: `curl -o public/vendor/seeb/widget.<sha8>.js https://seeb-widget.pages.dev/widget.js`.
3. Gerar o hash: `openssl dgst -sha384 -binary widget.<sha8>.js | openssl base64 -A` → `integrity="sha384-…"`.
4. `<Script src="/vendor/seeb/widget.<sha8>.js" integrity="sha384-…" crossOrigin="anonymous" strategy="lazyOnload" />`.
5. Auto-hospedar o logo e a fonte Atkinson (via `next/font/google` ou arquivo local) e ajustar a CSP.
6. Um job mensal (ou alerta) compara o hash remoto com o local para avisar quando houver versão nova.
7. Env `NEXT_PUBLIC_SEEB_WIDGET_URL` alterna entre remoto e local sem novo deploy de código.

### 6.6 Acessibilidade nativa (o SeeB é overlay, não substitui)

- Meta: **WCAG 2.2 AA + eMAG**. Conferência final no validador ASES do governo.
- `eslint-plugin-jsx-a11y@6.10.2` no lint e `@axe-core/playwright@4.14.0` em todas as telas, nos dois idiomas e nos 5 estados.
- Alvos ≥ 48px (56px nas ações primárias), contraste 4.5:1 no texto (a paleta entregue atinge AAA no texto principal do light) e 3:1 em componentes nos dois temas, foco visível, `prefers-reduced-motion`, rótulos reais (nunca só placeholder), erros com `aria-describedby` + `aria-live="polite"`, o microfone com `aria-pressed` e status falado ("Escuchando… / Ouvindo…").
- Números grandes e ícone **+ texto** sempre (público com letramento digital variado). A bandeira do seletor de idioma **nunca** aparece sozinha, sempre com o texto "Español" / "Português".
- `lang` correto também em trechos mistos (ex.: `<span lang="pt-BR">Recibo Não Fiscal</span>` dentro da UI em espanhol).
- Não usar atalhos Alt+letra no app (colidem com o SeeB).


---

## 7. Briefing de Decisões e Variáveis de Ambiente

O Claude Code deve criar, já no bootstrap do repositório:

- `src/config/brand.ts` — nome comercial, `short_name` do PWA, locale padrão, tratamento ES (`usted`/`tú`), flag do rodapé "Hecho con", flag da calculadora pública. Placeholder: `TallerApp`.
- `src/config/legal.ts` — razão social, CNPJ, endereço, e-mail e WhatsApp de suporte, SLA de 5 dias, nome e e-mail do DPO, foro, canal de denúncia, prazo de exclusão, retenção de logs. Campos vazios com TODO até o Rafael preencher (Grupo B).
- `.env.example` — o bloco C1 abaixo, **sem valores secretos**, comentado, pronto para o Rafael copiar para `.env.local`.

Itens 🔴 bloqueiam o código final ou o go-live. Itens 🟡 têm um padrão recomendado: o Claude **segue com o padrão** até o Rafael decidir.

```mermaid
flowchart LR
  A["Grupo A<br/>Decisões"] -->|nome, idioma, trial| CODE[Claude gera o MVP]
  C1["Grupo C<br/>Neon + Auth + Storage"] --> CODE
  CODE --> STG["Deploy de preview<br/>Modo Teste AbacatePay"]
  C2["Grupo C<br/>AbacatePay teste<br/>+ Pix Automático liberado"] --> STG
  D["Grupo D<br/>Termos validados<br/>(D1 paleta Usopp ✅)"] --> STG
  STG --> PROD[Go-live com cobrança real]
  B["Grupo B<br/>Dados legais"] --> PROD
  C3["Grupo C<br/>Chaves de produção + domínio"] --> PROD
  D2["Grupo D<br/>Revisão jurídica e contábil"] --> PROD
```

### 7.1 Grupo A — Decisões de produto e negócio

| # | Decisão | Opções | Padrão recomendado | Prioridade |
|---|---|---|---|---|
| A1 | **Nome comercial do SaaS** | Livre. Critérios: fácil de falar em ES e PT, sem acento obrigatório na URL, ≤ 12 caracteres para o `short_name` do PWA, domínio `.com.br` livre | Placeholder no código: `TallerApp` (troca centralizada em `src/config/brand.ts`) | 🔴 para o go-live / 🟡 para o código |
| A2 | **Idioma padrão inicial** (quando o navegador não indicar) | `es` ou `pt-BR` | **`es`**, porque o público-alvo é a comunidade boliviana; troca com 1 toque | 🟡 |
| A3 | **Regra de onboarding/trial** | (a) Freemium de 3 lotes, sem cartão → paywall com Pix Automático ou cartão; (b) Cartão com 7 dias grátis; (c) Pix Automático direto a R$ 35 com garantia de 7 dias | **(a) + no paywall: Pix Automático (garantia CDC de 7 dias) OU cartão com 7 dias grátis**. Lembre: na AbacatePay, **trial e cupom só funcionam no cartão** | 🔴 |
| A4 | Gatilho do paywall | 3 lotes / 30 dias / o que vier primeiro | **3 lotes ou 30 dias, o que vier primeiro** (hipótese a validar) | 🟡 |
| A5 | **Domínio `.com.br`** | Registrar no Registro.br (~R$ 40/ano: **confirmar o preço**) | Registrar já, junto com o nome (A1) | 🔴 para o go-live |
| A6 | Tratamento em espanhol | "usted" ou "tú" | **"usted"** (validar nas entrevistas) | 🟡 |
| A7 | Login | E-mail com código (OTP) / magic link / telefone-WhatsApp OTP (v1.1) | **E-mail com código de 6 dígitos** (Better Auth self-hosted no Neon) | 🟡 |
| A8 | Better Auth self-hosted vs Neon Auth | — | **Better Auth self-hosted** (o suporte a SMS/WhatsApp no Neon Auth não foi verificado) | 🟡 |
| A9 | Período padrão do acerto | Semanal (sábado) / quinzenal | **Semanal, sábado** (configurável por oficina) | 🟡 |
| A10 | Prazo de exclusão definitiva após "Eliminar cuenta" | 7 / 15 / 30 dias | **30 dias** (exceto os logs do Marco Civil, guardados 6 meses) | 🟡 |
| A11 | No modo leitura, permitir "Registrar pago" de dívidas antigas? | Sim / Não | **Sim** (é baixa do que já existe, não trabalho novo) | 🟡 |
| A12 | Rodapé "Hecho con [nome]" no link público do contratante | Sim / Não | **Sim, discreto** (canal viral) | 🟡 |
| A13 | Calculadora aberta sem login na landing (isca) | Sim / Não | **Sim** | 🟡 |
| A14 | Storage de fotos | Vercel Blob / Cloudflare R2 | **Vercel Blob no MVP**, pela simplicidade (ver C5) | 🟡 |

### 7.2 Grupo B — Dados legais obrigatórios (Decreto 7.962/2013, LGPD e Marco Civil)

Aparecem no rodapé, na página "Quiénes somos / Quem somos", nos Termos de Uso, na Política de Privacidade, nos e-mails transacionais e no checkout. O Claude deixa os campos em `src/config/legal.ts` prontos para preenchimento; **não inventa** razão social, CNPJ, endereço ou contato.

| # | Dado | Para quê / base | Prioridade |
|---|---|---|---|
| B1 | **Razão social ou nome empresarial do MEI** | Identificação do fornecedor (Decreto 7.962/2013, art. 2º) | 🔴 go-live |
| B2 | **CNPJ** | Identificação (art. 2º) + obrigatório para a conta AbacatePay | 🔴 go-live |
| B3 | **Endereço físico ou comercial** | Identificação (art. 2º). Pode ser endereço comercial/fiscal (⚠️ confirmar com o contador se um endereço fiscal virtual atende) | 🔴 go-live |
| B4 | **E-mail de suporte oficial** (ex.: `soporte@<domínio>`) + SLA publicado (**resposta em até 5 dias**) | Atendimento eletrônico (Decreto 7.962/2013) e pedidos de cancelamento/arrependimento | 🔴 go-live |
| B5 | WhatsApp de suporte (opcional, recomendado para o público) | Canal preferido do público | 🟡 |
| B6 | **Nome e e-mail do Encarregado (DPO)** da LGPD (pode ser o Rafael no início) | LGPD: encarregado identificado na política | 🔴 go-live |
| B7 | Enquadramento do SaaS: **MEI ou ME/Simples** + CNAE | ⚠️ Confirmar com o contador se licenciamento de software (LC 116, item 1.05) **cabe no MEI** e qual NFS-e emitir pela assinatura | 🔴 antes da 1ª cobrança real |
| B8 | Foro/cidade dos Termos de Uso | Cláusula contratual (observar que, em relação de consumo, o foro do consumidor prevalece; validar com advogado) | 🟡 |
| B9 | Canal de denúncia de uso indevido (trabalho forçado) | Termos (CP art. 149 / Lei SP 14.946/2013) | 🟡 (pode ser o e-mail B4) |
| B10 | Retenção de logs: confirmar **6 meses** (mínimo legal, Marco Civil art. 15) + margem de 30 dias antes do purge | Política de retenção | 🟡 |

### 7.3 Grupo C — Credenciais e `.env.example`

**Onde cada variável vive**

- **Local:** `.env.local` (nunca commitar; o `.env.example` vai para o repositório **sem valores**).
- **Vercel:** Project → Settings → Environment Variables, separando **Development / Preview / Production**. Preview usa as chaves de **teste** da AbacatePay + um branch do Neon por PR.
- **Nunca** colar segredos no chat, em issue ou em print. Guardá-los num gerenciador de senhas.

**C1. `.env.example` comentado** (criar exatamente assim no repositório):

```bash
# ───────────────── App ─────────────────
NEXT_PUBLIC_APP_URL=https://<seu-dominio>.com.br      # dev: https://localhost:3000 (next dev --experimental-https)
NEXT_PUBLIC_DEFAULT_LOCALE=es                         # decisão A2
NEXT_PUBLIC_BRAND_NAME=TallerApp                      # decisão A1

# ───────────────── Banco: Neon Postgres ─────────────────
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
#   ↑ POOLED (host com "-pooler"): runtime da app (drizzle-orm/neon-http)
DATABASE_URL_UNPOOLED=postgresql://user:pass@ep-xxx.sa-east-1.aws.neon.tech/neondb?sslmode=require
#   ↑ DIRETA (sem "-pooler"): só para drizzle-kit generate/migrate
#   Dica: escolher a região do Neon mais próxima de SP disponível (confirmar no painel)

# ───────────────── Auth ─────────────────
BETTER_AUTH_SECRET=                                   # openssl rand -base64 32
BETTER_AUTH_URL=${NEXT_PUBLIC_APP_URL}
# Se optar por Neon Auth (decisão A8):
# NEON_AUTH_BASE_URL=                                 # painel do Neon → Auth
# NEON_AUTH_COOKIE_SECRET=                            # openssl rand -base64 32

# E-mail transacional (OTP / magic link / confirmações de assinatura)
RESEND_API_KEY=                                       # ou outro provedor; exige domínio verificado (SPF/DKIM)
EMAIL_FROM="TallerApp <no-responder@<seu-dominio>.com.br>"
# v1.1, login por telefone (exige empresa verificada + template aprovado na WhatsApp Business Platform, ou provedor de SMS):
# WHATSAPP_OTP_PROVIDER_TOKEN=
# WHATSAPP_OTP_SENDER_ID=

# ───────────────── AbacatePay (API v2) ─────────────────
ABACATEPAY_API_KEY=                                   # chave de TESTE em dev/preview, chave de PRODUÇÃO só em Production
ABACATEPAY_WEBHOOK_SECRET=                            # o mesmo secret informado ao criar o webhook (openssl rand -hex 32, ≥ 32 caracteres)
ABACATEPAY_PUBLIC_KEY=                                # chave PÚBLICA fixa publicada na doc de segurança da AbacatePay
                                                      #   (usada para validar o X-Webhook-Signature; NÃO é o seu secret nem a pk_)
ABACATEPAY_PRODUCT_ID_MONTHLY=prod_xxx                # produto R$ 35,00 (3500 centavos), cycle: "MONTHLY", sem trial
ABACATEPAY_PRODUCT_ID_MONTHLY_CARD_TRIAL=             # opcional: o mesmo produto com trialDays: 7, só para cartão (testar antes)

# ───────────────── Storage de fotos (escolha UMA opção, ver C5) ─────────────────
BLOB_READ_WRITE_TOKEN=                                # opção 1: Vercel Blob
# R2_ACCOUNT_ID=                                      # opção 2: Cloudflare R2 (API compatível com S3)
# R2_ACCESS_KEY_ID=
# R2_SECRET_ACCESS_KEY=
# R2_BUCKET=taller-fotos
# R2_PUBLIC_BASE_URL=

# ───────────────── Segurança / LGPD ─────────────────
DATA_ENCRYPTION_KEY=                                  # 32 bytes base64 (openssl rand -base64 32): criptografa CPF/RNM
CRON_SECRET=                                          # protege /api/cron/* (Vercel Cron envia no header Authorization)

# ───────────────── Acessibilidade ─────────────────
NEXT_PUBLIC_SEEB_WIDGET_URL=https://seeb-widget.pages.dev/widget.js
#   ↑ trocar para /vendor/seeb/widget.<sha8>.js se a auto-hospedagem for autorizada (item D6)

# ───────────────── Parâmetros legais (podem ir para a tabela legal_params) ─────────────────
# MINIMUM_WAGE_MONTHLY_CENTS=                         # ⚠️ CONFIRMAR o valor vigente do salário mínimo (decreto) via leis-mcp antes de preencher
```

**C2. Checklist do Neon**

| # | Tarefa |
|---|---|
| C2.1 | Criar o projeto no Neon (plano Free para começar; ⚠️ confirmar limites e preço do Launch quando crescer) |
| C2.2 | Copiar a string **pooled** (`DATABASE_URL`) e a **direta** (`DATABASE_URL_UNPOOLED`) |
| C2.3 | Ativar a integração Neon ↔ Vercel para criar **um branch por preview** (opcional, recomendado) |
| C2.4 | Se escolher Neon Auth: ativar no painel e copiar `NEON_AUTH_BASE_URL` |

**C3. Checklist da AbacatePay** ⚠️ Comece hoje: depende de liberação deles.

| # | Tarefa |
|---|---|
| C3.1 | Criar a conta com o **CNPJ** do SaaS (B2) |
| C3.2 | 🔴 **Solicitar a habilitação de Pix Automático e de Assinaturas na conta, INCLUSIVE NO MODO TESTE** (sem isso o checkout com `methods: ["PIX"]` não funciona, e assinaturas em produção também precisam de liberação) |
| C3.3 | Gerar a **chave de API de teste** e, depois, a **de produção** |
| C3.4 | Criar o produto **R$ 35,00, `cycle: "MONTHLY"`** → anotar o `prod_…` (`ABACATEPAY_PRODUCT_ID_MONTHLY`) |
| C3.5 | (Opcional) Criar o produto com `trialDays: 7` para o cartão e **testar no Modo Teste** como o trial se comporta com Pix |
| C3.6 | Gerar o secret (`openssl rand -hex 32`) e criar o webhook `POST /v2/webhooks/create` apontando para `https://<domínio>/api/webhooks/abacatepay` com os eventos `subscription.completed`, `subscription.trial_started`, `subscription.renewed`, `subscription.payment_failed`, `subscription.plan_changed`, `subscription.cancelled`, `checkout.completed`. ⚠️ **Não dá para editar o webhook**: para mudar, crie outro e exclua o antigo. Um webhook para teste (URL de preview) e outro para produção |
| C3.7 | Copiar a **chave pública fixa** da doc de segurança para `ABACATEPAY_PUBLIC_KEY` |
| C3.8 | Confirmar se existe **endpoint de reembolso** (para o CDC art. 49). Se não existir, definir o processo manual (Pix de devolução em ≤ 7 dias) |
| C3.9 | Confirmar o domínio exato do checkout para a CSP (`form-action`) |

**C4. Vercel**

| # | Tarefa |
|---|---|
| C4.1 | Criar o projeto e ligar ao repositório |
| C4.2 | ⚠️ **Confirmar nos termos da Vercel se o plano Hobby permite uso comercial.** Os termos restringem o Hobby a uso não comercial; antes da 1ª cobrança real, avaliar o Pro (preço a confirmar) |
| C4.3 | Cadastrar as variáveis por ambiente (Development / Preview / Production) |
| C4.4 | Apontar o domínio `.com.br` (DNS do Registro.br → Vercel) |
| C4.5 | Configurar o Vercel Cron (`/api/cron/retention`, `/api/cron/subscription-sweeper`) com `CRON_SECRET` |

**C5. Storage de fotos**

| Opção | Prós | Contras | Recomendação |
|---|---|---|---|
| **Vercel Blob** | Integração nativa com Next/Vercel, 1 variável (`BLOB_READ_WRITE_TOKEN`), upload direto do cliente | Limites e preço do free tier a confirmar; pode ficar caro com muito tráfego | **Para o MVP**, pela simplicidade |
| **Cloudflare R2** | Free tier generoso e **sem custo de egress** (⚠️ confirmar os limites atuais na página de preços), API S3 | Mais configuração (5 variáveis, CORS, URL assinada via SDK S3) | Migrar se o volume de fotos crescer |

Em ambos: compressão no cliente (WebP, ~1600px), remoção de EXIF/GPS, chave aleatória e URLs assinadas de curta duração.

**C6. Ferramentas do Claude Code:** instalação na seção 2.9 (Impeccable, leis-mcp, brasil-legal-skills, KivoHub opcional, shadcn/ui).

### 7.4 Grupo D — Assets e conteúdo real inicial

| # | Item | Responsável | Entregável esperado | Prioridade |
|---|---|---|---|---|
| D1 | **Paleta e identidade visual técnica** — ✅ **CONCLUÍDO em 13/11/2026** | **Usopp** | Entregue: `identidade-visual.md` + `tokens.css` (salvos em 13/11/2026). Tokens semânticos shadcn/Tailwind v4 em **OKLCH + HEX**, temas claro (`:root`) e escuro (`.dark`), 6 status do domínio, `--aging-ok/watch/late` (0–7 / 8–15 / 16+ dias), `--radius` 8px, tipografia (`--font-sans` Atkinson Hyperlegible Next, `--font-display` IBM Plex Sans, `--font-mono` IBM Plex Mono), matriz de contraste WCAG 2.2 com **164 pares e 0 falhas**, simulação de daltonismo pelas matrizes do SeeB, regras de convivência com o SeeB e briefing de logo/ícones. Encaixe: copiar `./tokens.css` para `src/styles/tokens.css`. Resumo: seção 8 | ✅ concluído |
| D2 | **Logo** (`brand/logo.svg`, `logo-mark.svg`, `logo-mono.svg`) | **Claude** (a partir da paleta entregue do Usopp: seção 8.9 e `identidade-visual.md`, seção 7) | SVG limpo (`viewBox`, `currentColor`, sem `<style>` interno, `role="img"` + `<title>`), otimizado com SVGO; ícones PWA 192/512/maskable + `apple-icon` 180×180 gerados por `scripts/generate-icons.ts` (sharp); OG 1200×630 por idioma | 🟡 |
| D3 | **Validação dos termos de costura** com **3 a 5 oficinas bolivianas de SP** | Rafael (entrevistas do teste de 48h) | Confirmar ou corrigir: *corte, lote, paquete, recta, overlock, collareta (galoneira), interlock, avíos, adelanto/vale, pago semanal/quincenal, entrega/conteo, falla, arreglo, reproceso, cobro*. ⚠️ Não há fonte acadêmica que valide o jargão da comunidade de SP | 🔴 antes do go-live |
| D4 | Validação de "usted" vs "tú" e do tom das mensagens de cobrança | Rafael (entrevistas) | Escolha final (A6) + 2 versões de mensagem testadas | 🟡 |
| D5 | **Revisão jurídica e contábil final** | Advogado + contador | (a) Termos de Uso + DPA de operador + Política de Privacidade (ES/PT); (b) texto do "Recibo Não Fiscal" + orientação sobre o Emissor Nacional NFS-e; (c) alertas CLT art. 78 e de jornada (redação e parâmetros); (d) dicas de CNAE MEI 1412-6/03 e vedação de cessão de mão de obra (Res. CGSN 140, art. 112); (e) cláusula contra trabalho análogo à escravidão; (f) enquadramento do próprio SaaS (B7); (g) força probatória do aceite eletrônico no link público | 🔴 antes da 1ª cobrança real |
| D6 | **Licença do SeeB** (`devrafcks/seeb-extension`): autorizar auto-hospedagem com SRI? (e, se o repo for do Rafael, aceitar contribuições upstream: i18n em ES, `data-*`, `MutationObserver` para portais) | Rafael | Sim/Não + licença confirmada | 🟡 |
| D7 | Valor vigente do **salário mínimo** para o alerta CLT art. 78 | Claude via `leis-mcp` + revisão do contador | `legal_params.minimum_wage_monthly_cents` com data de vigência e fonte | 🔴 antes de ligar o alerta |
| D8 | Conferir no texto integral qualquer estatística de calote **antes** de usá-la em material público | Rafael | Citação conferida no original ou dado descartado. **Não usar em landing, pitch ou material público nenhum percentual que não tenha sido aberto e citado na fonte** | 🟡 |
| D9 | Fotos e exemplos para landing e screenshots do PWA | Rafael / Claude (dados **fictícios**) | Screenshots com dados de exemplo; **nunca dados reais de oficinas ou pessoas** | 🟡 |
| D10 | Lista de **3 a 5 oficinas piloto** (contato interno, não sai do controle do Rafael) | Rafael | Nomes/contatos só no CRM dele; o primeiro contato fica em rascunho para aprovação | 🔴 para o teste de 48h |

### 7.5 Checklist final de go-live

- [ ] A1, A3 e A5 decididos; domínio apontado e com HTTPS
- [ ] B1–B4, B6 e B7 preenchidos e publicados no rodapé e na página "Quiénes somos"
- [ ] AbacatePay: Pix Automático + Assinaturas **liberados em produção**, produto R$ 35 `MONTHLY`, webhook de produção criado e testado (assinatura e idempotência)
- [ ] Fluxo completo testado em Modo Teste: freemium → paywall → Pix Automático → `subscription.completed` → renovação → falha → modo leitura → cancelamento self-service → reembolso em 7 dias
- [ ] Paleta do Usopp (D1 ✅ entregue) aplicada: `tokens.css` copiado para `src/styles/tokens.css`, fontes de `src/styles/fonts.ts` ligadas, zero hex hardcoded; axe sem violações de contraste nos dois temas e nos dois idiomas
- [ ] Logo, ícones PWA (192/512/maskable), `apple-icon` 180×180 e OpenGraph bilíngue gerados (seção 8.9)
- [ ] Termos validados com as oficinas (D3); revisão jurídica e contábil (D5) concluída
- [ ] Logs do Marco Civil gravando + cron de retenção ativo
- [ ] Exportar/excluir dados (LGPD art. 18) funcionando
- [ ] SeeB carregando sem erro de hidratação; portais dentro de `#app`; página de acessibilidade em ES publicada
- [ ] Vercel em plano compatível com uso comercial (C4.2)

---

## 8. Identidade Visual Técnica e Paleta (Entrega do Usopp)

> ✅ **Item D1 concluído em 13/11/2026** (horário de Brasília, UTC-3). Arquivos entregues, na mesma pasta deste documento:
> - [`tokens.css`](./tokens.css): CSS pronto para copiar em `src/styles/tokens.css` (`:root` light, `.dark`, `@theme inline`, `@layer base` e `@layer utilities`).
> - [`identidade-visual.md`](./identidade-visual.md): especificação completa, incluindo a **matriz de contraste com os 164 pares**, a simulação de daltonismo pelas matrizes do SeeB, a tipografia e o briefing de logo/assets.
>
> Esta seção é um resumo operacional. **Em caso de dúvida, `tokens.css` é a fonte da verdade dos valores** e `identidade-visual.md` é a fonte da verdade das regras. Não invente cor, fonte ou raio fora deles.
>
> Mapa de referências cruzadas: quando `identidade-visual.md` cita "doc 02, seção 5.x" (SeeB/CSP/acessibilidade), o conteúdo equivalente neste arquivo está na **seção 6.x**; quando cita "Grupo A1 em `03-briefing-inputs-rafael.md`", veja a **seção 7.1 (A1)**; "doc 02, jornada 5" = **Jornada 5 da seção 3**.

### 8.1 Direção de arte: "Caderno de ficha de corte"

- **Utilitária e humana**, precisa como um ponto de costura reto. Não é "app de startup" nem dashboard corporativo cinza.
- **Calor de material, não de cartão-postal:** papel de ficha de corte / algodão cru (`#FAF6EE`), índigo de linha e tinta técnica (`#1C4066` / `#121D29`), terracota de carretel só como acento e como status de conserto.
- **Cirurgicamente legível:** no light mode, texto principal, valores em R$ e rótulos críticos de status atingem **AAA (≥ 7:1)**; bordas de input, anel de foco e ícones funcionais atingem **≥ 3:1** (WCAG 1.4.11).
- **Zero AI slop:** sem degradê roxo/neon, sem vidro fosco (`backdrop-filter`), sem raio de pílula em card, sem sombra teatral, sem ilustração 3D genérica.
- **Zero folclore caricato:** nada de arco-íris andino literal, chullo, padrão inca estampado na UI. A referência cultural está nos **materiais** (papel, linha, barro), não no figurino.
- **Status nunca só por cor:** sempre **cor + ícone Lucide + rótulo textual**, nas duas línguas.
- Light mode (`:root`) é o **padrão da oficina** (iluminação mista, fluorescente + sol). Dark mode (`.dark` no `<html>`) é o tema nativo para uso noturno.

**Três sugestões conceituais de nome** (para o Rafael escolher na decisão A1; **sem verificação de INPI, de marca em uso nem de domínio `.com.br`**). Até a decisão, o código usa o placeholder `TallerApp` em `src/config/brand.ts`.

| Nome | `short_name` (PWA, ≤ 12) | Ideia |
|---|---|---|
| **Puntada** | `Puntada` (8) | O ponto de costura: precisão, um ponto registrado |
| **Constancia** | `Constancia` (10) | Comprovante/atestado: nomeia a dor nº 1, a prova de entrega |
| **Bitácora** | `Bitacora` (8, sem acento no manifest e no domínio) | Diário de registro: o "Caderno Digital del Taller" numa palavra |

### 8.2 Tokens não-cromáticos (de `tokens.css`)

| Token | Valor | Uso |
|---|---|---|
| `--radius` (= `--radius-lg`) | `0.5rem` (8px) | Cards, dialogs, inputs: canto de ficha, não pílula. Escala: `--radius-sm` 0.25rem · `--radius-md` 0.375rem · `--radius-xl` 0.75rem · `--radius-2xl` 1rem · `--radius-3xl` 1.25rem |
| `--touch-target-min` | `3rem` (48px) | Alvo mínimo de toque (utility `.touch-target`) |
| `--touch-target-comfort` | `3.5rem` (56px) | Ações primárias, microfone, bottom nav |
| `--seeb-safe-right` / `--seeb-safe-bottom` | `calc(20px + 55px + 12px)` = **87px** | Respiro do FAB do SeeB (utility `.seeb-safe-end`) |
| `--seeb-panel-width` | `340px` | Largura do painel do SeeB (100vw em ≤ 600px) |
| `--z-dropdown` / `--z-sticky` / `--z-overlay` / `--z-modal` / `--z-toast` / `--z-max-app` | 50 / 100 / 200 / 300 / 400 / **9990** | Nenhum `z-index` do app passa de 9990 |
| `--shadow-card` | `0 1px 0 oklch(0.2280 0.0280 250.00 / 0.06)` (dark: `oklch(0.9300 0.0150 85.00 / 0.06)`) | Sombra residual; hierarquia por borda |
| `--theme-color` / `--theme-background` | light `#1C4066` / `#FAF6EE` · dark `#91B5DD` / `#101820` | `theme_color` e `background_color` do PWA |
| Bordas | card `1px solid var(--border)` · input `1.5px solid var(--input)` | Bordas nítidas, sem sombra pesada |

### 8.3 Paleta semântica (shadcn/ui v4) — Light `:root` e Dark `.dark`

Valores exatos de `tokens.css` (OKLCH documentado = HEX comentado; tudo dentro do gamut sRGB, sem clipping).

| Token | Light `:root` OKLCH | Light HEX | Dark `.dark` OKLCH | Dark HEX | Uso |
|---|---|---|---|---|---|
| `--background` | `oklch(0.9750 0.0120 85.00)` | `#FAF6EE` | `oklch(0.2050 0.0200 250.00)` | `#101820` | Papel de ficha de corte / algodão cru (fundo) |
| `--foreground` | `oklch(0.2280 0.0280 250.00)` | `#121D29` | `oklch(0.9300 0.0150 85.00)` | `#ECE7DD` | Tinta técnica; texto principal e valores em R$ |
| `--card` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | `oklch(0.2500 0.0220 250.00)` | `#1A232C` | Cards e superfícies elevadas |
| `--card-foreground` | `oklch(0.2280 0.0280 250.00)` | `#121D29` | `oklch(0.9300 0.0150 85.00)` | `#ECE7DD` | Texto em card |
| `--popover` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | `oklch(0.2500 0.0220 250.00)` | `#1A232C` | Menus/popovers opacos (sem vidro) |
| `--popover-foreground` | `oklch(0.2280 0.0280 250.00)` | `#121D29` | `oklch(0.9300 0.0150 85.00)` | `#ECE7DD` | Texto em popover |
| `--primary` | `oklch(0.3650 0.0780 252.00)` | `#1C4066` | `oklch(0.7600 0.0700 252.00)` | `#91B5DD` | Índigo de linha: botão primário, link forte, marca |
| `--primary-foreground` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | `oklch(0.1850 0.0320 250.00)` | `#071420` | Texto sobre primary |
| `--secondary` | `oklch(0.9320 0.0180 80.00)` | `#EFE7DB` | `oklch(0.3000 0.0250 250.00)` | `#242F3A` | Linho cru: botão secundário, chip neutro |
| `--secondary-foreground` | `oklch(0.2600 0.0300 250.00)` | `#192532` | `oklch(0.9300 0.0150 85.00)` | `#ECE7DD` | Texto sobre secondary |
| `--muted` | `oklch(0.9440 0.0140 85.00)` | `#F1ECE2` | `oklch(0.2800 0.0200 250.00)` | `#212A33` | Fundos de tabela, skeleton |
| `--muted-foreground` | `oklch(0.4000 0.0280 250.00)` | `#3C4957` | `oklch(0.7600 0.0200 85.00)` | `#B7B0A3` | Texto auxiliar (proibido em R$ e status crítico) |
| `--accent` | `oklch(0.9360 0.0280 52.00)` | `#FAE5D9` | `oklch(0.3200 0.0400 50.00)` | `#442D20` | Terracota sutil: hover/seleção |
| `--accent-foreground` | `oklch(0.3200 0.0700 45.00)` | `#4F2611` | `oklch(0.9300 0.0300 70.00)` | `#F5E5D3` | Texto sobre accent |
| `--destructive` | `oklch(0.3000 0.1100 25.00)` | `#590A0E` | `oklch(0.7300 0.1100 25.00)` | `#E58C84` | Exclusão / erro irreversível |
| `--destructive-foreground` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | `oklch(0.1850 0.0320 250.00)` | `#071420` | Texto sobre destructive |
| `--border` | `oklch(0.6200 0.0180 80.00)` | `#8C857A` | `oklch(0.5800 0.0250 250.00)` | `#6F7C89` | Borda estrutural interativa (≥ 3:1) |
| `--input` | `oklch(0.5600 0.0220 80.00)` | `#7B7366` | `oklch(0.6200 0.0280 250.00)` | `#7A8897` | Borda de campo (≥ 3:1) |
| `--ring` | `oklch(0.4500 0.0800 252.00)` | `#325780` | `oklch(0.7600 0.0700 252.00)` | `#91B5DD` | Anel de foco (≥ 3:1) |
| `--success` | `oklch(0.3200 0.0680 150.00)` | `#143C1F` | `oklch(0.7800 0.0800 150.00)` | `#93C69D` | Sucesso / Pix recebido (alias do sólido paid) |
| `--success-foreground` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | `oklch(0.1850 0.0320 250.00)` | `#071420` | Texto sobre success |
| `--warning` | `oklch(0.4450 0.0880 80.00)` | `#6D4D09` | `oklch(0.8400 0.0900 80.00)` | `#EAC586` | Aviso de sistema (ocre; não é status de lote) |
| `--warning-foreground` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | `oklch(0.1850 0.0320 250.00)` | `#071420` | Texto sobre warning |
| `--info` | `oklch(0.4000 0.0550 230.00)` | `#254D60` | `oklch(0.7800 0.0500 230.00)` | `#97BED2` | Informativo (azul-petróleo) |
| `--info-foreground` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | `oklch(0.1850 0.0320 250.00)` | `#071420` | Texto sobre info |
| `--chart-1` | `oklch(0.3650 0.0780 252.00)` | `#1C4066` | `oklch(0.7200 0.0700 252.00)` | `#85A8D0` | Série 1: índigo |
| `--chart-2` | `oklch(0.3200 0.0680 150.00)` | `#143C1F` | `oklch(0.7800 0.0800 150.00)` | `#93C69D` | Série 2: verde-floresta |
| `--chart-3` | `oklch(0.4300 0.0900 48.00)` | `#773F1F` | `oklch(0.8700 0.0650 48.00)` | `#F9C8B0` | Série 3: terracota |
| `--chart-4` | `oklch(0.4450 0.0880 80.00)` | `#6D4D09` | `oklch(0.8400 0.0900 80.00)` | `#EAC586` | Série 4: ocre |
| `--chart-5` | `oklch(0.4100 0.0950 325.00)` | `#643666` | `oklch(0.8000 0.0800 325.00)` | `#D9ACDA` | Série 5: ameixa |

Aliases de sidebar do shadcn (`--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`) apontam para `--card`, `--card-foreground`, `--primary`, `--primary-foreground`, `--accent`, `--accent-foreground`, `--border` e `--ring`, nos dois temas.

### 8.4 Os 6 status do domínio têxtil/financeiro

Cada status tem superfície `-bg`, texto `-fg` (AAA sobre a superfície), sólido `-solid` + `-solid-fg` (pílula AAA) e borda `-border` (≥ 3:1). No dark, os sólidos ficam **claros com tinta escura** (`#071420`). Utilities Tailwind geradas pelo `@theme inline`: `bg-paid-bg`, `text-paid-fg`, `bg-paid-solid`, `text-paid-solid-fg`, `border-paid-border` (idem para `in-production`, `awaiting-confirmation`, `overdue-calote`, `rework`, `clt-warning`).

| Status | Ícone Lucide + rótulo (obrigatório) | Matiz |
|---|---|---|
| `paid` | `CircleCheck` + "Pagado / Pago" | Verde-floresta (H 150) |
| `in-production` | `Scissors` + "En costura / Em costura" | Índigo da marca (H 252) |
| `awaiting-confirmation` | `Clock` + "Esperando confirmación / Aguardando aceite" | Ameixa (H 325) |
| `overdue-calote` | `TriangleAlert` + "Vencido / Em atraso" | Carmesim profundo (H 25) |
| `rework` | `RotateCcw` + "Arreglo / Conserto" | Terracota de carretel (H 48) |
| `clt-warning` | `Scale` + "Piso CLT / Jornada" | Aço / ciano-petróleo (H 205). **Nunca** reutilizar o vermelho de calote: é alerta trabalhista, não dívida |

| Token | Light `:root` OKLCH | Light HEX | Dark `.dark` OKLCH | Dark HEX |
|---|---|---|---|---|
| `--paid-bg` | `oklch(0.9450 0.0240 150.00)` | `#E2F2E5` | `oklch(0.2600 0.0300 150.00)` | `#19281C` |
| `--paid-fg` | `oklch(0.3200 0.0680 150.00)` | `#143C1F` | `oklch(0.8600 0.0550 150.00)` | `#B8DCBE` |
| `--paid-solid` | `oklch(0.3200 0.0680 150.00)` | `#143C1F` | `oklch(0.7800 0.0800 150.00)` | `#93C69D` |
| `--paid-solid-fg` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | `oklch(0.1850 0.0320 250.00)` | `#071420` |
| `--paid-border` | `oklch(0.5000 0.0500 150.00)` | `#4F6C54` | `oklch(0.6200 0.0500 150.00)` | `#718F76` |
| `--in-production-bg` | `oklch(0.9400 0.0220 252.00)` | `#E1EDFA` | `oklch(0.2600 0.0320 252.00)` | `#182533` |
| `--in-production-fg` | `oklch(0.3000 0.0700 252.00)` | `#0F2F50` | `oklch(0.8600 0.0550 252.00)` | `#B8D4F5` |
| `--in-production-solid` | `oklch(0.4200 0.0780 252.00)` | `#2B4F76` | `oklch(0.7200 0.0700 252.00)` | `#85A8D0` |
| `--in-production-solid-fg` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | `oklch(0.1850 0.0320 250.00)` | `#071420` |
| `--in-production-border` | `oklch(0.5000 0.0650 252.00)` | `#486688` | `oklch(0.6000 0.0550 252.00)` | `#6883A1` |
| `--awaiting-confirmation-bg` | `oklch(0.9450 0.0250 325.00)` | `#F6E7F6` | `oklch(0.2600 0.0320 325.00)` | `#2C1F2D` |
| `--awaiting-confirmation-fg` | `oklch(0.3200 0.0850 325.00)` | `#48214A` | `oklch(0.8800 0.0650 325.00)` | `#EEC9F0` |
| `--awaiting-confirmation-solid` | `oklch(0.4100 0.0950 325.00)` | `#643666` | `oklch(0.8200 0.0800 325.00)` | `#DFB3E1` |
| `--awaiting-confirmation-solid-fg` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | `oklch(0.1850 0.0320 250.00)` | `#071420` |
| `--awaiting-confirmation-border` | `oklch(0.5200 0.0800 325.00)` | `#805982` | `oklch(0.6400 0.0650 325.00)` | `#A17FA2` |
| `--overdue-calote-bg` | `oklch(0.9450 0.0240 25.00)` | `#FDE7E5` | `oklch(0.2500 0.0380 25.00)` | `#321A18` |
| `--overdue-calote-fg` | `oklch(0.3000 0.1100 25.00)` | `#590A0E` | `oklch(0.8800 0.0600 25.00)` | `#FDC9C4` |
| `--overdue-calote-solid` | `oklch(0.3000 0.1100 25.00)` | `#590A0E` | `oklch(0.7300 0.1100 25.00)` | `#E58C84` |
| `--overdue-calote-solid-fg` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | `oklch(0.1850 0.0320 250.00)` | `#071420` |
| `--overdue-calote-border` | `oklch(0.5000 0.1000 25.00)` | `#944A46` | `oklch(0.6400 0.0900 25.00)` | `#BD7670` |
| `--rework-bg` | `oklch(0.9450 0.0220 48.00)` | `#FAE9E0` | `oklch(0.2600 0.0320 48.00)` | `#311F16` |
| `--rework-fg` | `oklch(0.3500 0.0800 48.00)` | `#5B2B10` | `oklch(0.9000 0.0500 50.00)` | `#FBD5C1` |
| `--rework-solid` | `oklch(0.4300 0.0900 48.00)` | `#773F1F` | `oklch(0.8700 0.0650 48.00)` | `#F9C8B0` |
| `--rework-solid-fg` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | `oklch(0.1850 0.0320 250.00)` | `#071420` |
| `--rework-border` | `oklch(0.5400 0.0800 48.00)` | `#956045` | `oklch(0.6600 0.0650 48.00)` | `#B48770` |
| `--clt-warning-bg` | `oklch(0.9400 0.0220 205.00)` | `#DBF0F2` | `oklch(0.2600 0.0280 205.00)` | `#12282A` |
| `--clt-warning-fg` | `oklch(0.3200 0.0500 205.00)` | `#093A3F` | `oklch(0.8600 0.0450 205.00)` | `#AFDADF` |
| `--clt-warning-solid` | `oklch(0.3200 0.0500 205.00)` | `#093A3F` | `oklch(0.8800 0.0500 195.00)` | `#B2E2E2` |
| `--clt-warning-solid-fg` | `oklch(0.9920 0.0060 85.00)` | `#FEFCF8` | `oklch(0.1850 0.0320 250.00)` | `#071420` |
| `--clt-warning-border` | `oklch(0.5000 0.0450 205.00)` | `#436B6F` | `oklch(0.6200 0.0450 205.00)` | `#668E93` |

### 8.5 Envelhecimento de dívida (`--aging-*`) e mapeamento para os enums do Drizzle

Aliases definidos em `tokens.css` (nos dois temas), para as faixas de atraso do painel **Cobros** (Jornada 5):

| Alias | Aponta para | Faixa |
|---|---|---|
| `--aging-ok` / `-fg` / `-bg` / `-border` | `--paid-solid` / `--paid-solid-fg` / `--paid-bg` / `--paid-border` | 0–7 dias em aberto |
| `--aging-watch` / `-fg` / `-bg` / `-border` | `--warning` / `--warning-foreground` / `--awaiting-confirmation-bg` / `--awaiting-confirmation-border` | 8–15 dias |
| `--aging-late` / `-fg` / `-bg` / `-border` | `--overdue-calote-solid` / `--overdue-calote-solid-fg` / `--overdue-calote-bg` / `--overdue-calote-border` | 16+ dias / risco de calote (as barras 16–30 e 30+ da Jornada 5 usam ambas `--aging-late`) |

| Enum (Drizzle) | Token visual | Observação |
|---|---|---|
| `batches.status = received` | `--secondary` / `--muted` | Neutro: o corte chegou, ainda não entrou na máquina |
| `batches.status = in_production` | `--in-production-*` | Lote ativo |
| `batches.status = ready` | `--info` + ícone `PackageCheck` | Listo para entregar |
| `batches.status = delivered` | `--paid-bg` / `--info` + ícone | Entregue; o dinheiro ainda pode estar em aberto (ver recebível) |
| `batches.status = closed` / `canceled` | `--muted` | Encerrado |
| `receivables.status = awaiting_confirmation` | `--awaiting-confirmation-*` | Prova enviada, esperando o OK do contratante |
| `receivables.status = open` (0–7 dias) | `--aging-ok` | No prazo combinado |
| `receivables.status = open` (8–15 dias) | `--aging-watch` | Atenção |
| `receivables.status = open` (16+ dias) | `--aging-late` | Risco de calote |
| `receivables.status = disputed` | `--rework-*` | Divergência de quantidade: precisa de acordo, ainda não é calote |
| `receivables.status = partially_paid` | `--aging-watch` | Baixa parcial |
| `receivables.status = paid` / `settlements.status = paid` | `--paid-*` | Quitado |
| `receivables.status = written_off` | `--muted` + borda `--overdue-calote-border` | "Dar por perdido", visualmente recuado |
| Alerta CLT art. 78 / jornada | `--clt-warning-*` | Alerta educativo, não bloqueia |

### 8.6 Matriz de contraste WCAG 2.2 (resumo)

- Método: luminância relativa `L = 0.2126*R + 0.7152*G + 0.0722*B` a partir do HEX sRGB 8-bit, linearização IEC 61966-2-1, razão `(L1 + 0,05) / (L2 + 0,05)`. Script de 13/11/2026.
- **164 pares críticos medidos (82 por tema). 0 falhas.**
- Light: **39/39 pares de texto em AAA** (o menor é `warning-fg` / `warning` = **7.546:1**). Dark: **38/39 em AAA**; o único AA é `muted-foreground` / `muted` = **6.755:1** (texto auxiliar, **proibido em valores de R$**).
- Mínimo de UI/borda (1.4.11): light **3.387:1** (`border` / `background`), dark **3.725:1** (`border` / `card`).
- **Daltonismo (matrizes `feColorMatrix` reais do SeeB, Alt+2…5):** protanopia e deuteranopia sem colapso em nenhum par crítico no light (`paid` vs `overdue-calote` com ΔE00 > 17); na tritanopia e em alguns pares do dark há pares **WEAK** (ΔE00 entre ~6,4 e ~9,6), **nenhum colapsa** (critério de colapso: ΔE00 < 5). No **monocromático**, seis sólidos AAA não cabem em faixas de luminância todas distintas.
- **Consequência obrigatória:** todo status leva **ícone Lucide + texto** nas duas línguas, nos dois temas, com ou sem SeeB. Não trocar pares já medidos; não clarear `--muted-foreground`; não usar muted em dinheiro.
- Tabelas completas (164 pares + daltonismo por tema e por filtro): `identidade-visual.md`, seção 3.

### 8.7 Tipografia (`next/font/google`) e escala mobile-first

```ts
// src/styles/fonts.ts
import { Atkinson_Hyperlegible_Next, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

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

- No `<html>` do `src/app/[locale]/layout.tsx`: `className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}` (código completo na seção 6.3).
- Papéis: `--font-sans` = Atkinson Hyperlegible Next (corpo/UI) · `--font-display` = IBM Plex Sans (`h1`, `h2`, `.font-display`: títulos, marca, cabeçalho do recibo) · `--font-mono` = IBM Plex Mono (ref. de lote, chave Pix, hash, token).
- **`.tabular-money`** (obrigatória em todo valor em R$ e em toda contagem de peças): `font-variant-numeric: tabular-nums lining-nums; font-feature-settings: "tnum" 1, "lnum" 1;`. Os dígitos da Atkinson são **proporcionais por padrão**; sem a classe, colunas de dinheiro "dançam". Variante `.tabular-money-mono` para Plex Mono.
- Quando o SeeB carrega, ele adiciona `seeb-font-active` no `<html>` e força a Atkinson Hyperlegible **original** em `html, body` (não usa seletor universal). Aceitar isso no corpo; títulos em Plex (`font-display`) e mono sobrevivem.
- **Escala mobile-first (sempre em `rem`, porque o Alt+T do SeeB faz `html { font-size: 125% }`):**

| Papel | Tamanho | Entrelinha | Peso | Família |
|---|---|---|---|---|
| Corpo | `1rem` (16px) no mobile; `1.125rem` (18px) a partir de 640px | 1,5 | 400 | sans |
| Texto auxiliar | `0.875rem` **só em desktop**; no mobile, nunca abaixo de 16px | 1,45 | 400 | sans |
| Input / textarea / select | **mínimo `1rem` (16px)** em qualquer breakpoint (evita zoom automático) | 1,4 | 400 | sans |
| Valores em R$ e peças | `1.125–1.5rem`, sempre `.tabular-money` | 1,2 | 600 | sans |
| Rótulo de status | `0.875–1rem` + ícone | 1,3 | 600 | sans |
| `h1` (recibo, marca) | `1.5–1.75rem` | 1,25 | 600 | display |
| `h2` / título de tela | `1.25–1.5rem` | 1,3 | 600 | display |
| Código / Pix / token | `0.875–1rem` | 1,4 | 400–500 | mono |

- Grid: referência de **360px**, uma coluna no mobile, padding horizontal `1rem` (1.5rem acima de 640px), largura máxima de leitura `40rem`. Bottom nav ≥ 56px + `env(safe-area-inset-bottom)`.
- Toque: **≥ 48×48px**, ações primárias **56px**, **gap ≥ 12px entre ações opostas** (ex.: "Confirmo el recibimiento" vs "Recibí con diferencia"; "Registrar pago" vs "Dar por perdido"), de preferência empilhadas no mobile.

### 8.8 Convivência CSS/tokens com o SeeB

Complementa a seção 6 (estratégia do layout, CSP, testes):

1. **`<div id="app">`** envolve todo o app e **`<div id="portal-root" />`** fica **dentro** dele; todos os portais Radix/shadcn (Dialog, Sheet, Popover, Select, DropdownMenu) e o `<Toaster />` do Sonner montam ali. Script com `next/script` + `strategy="lazyOnload"`.
2. **Overlays com `.overlay-scrim`** (alfa no `background-color`: light `oklch(0.2280 0.0280 250.00 / 0.6)`, dark `oklch(0.2050 0.0200 250.00 / 0.72)`) e `backdrop-filter: none`. O "reduzir transparência" do SeeB força `opacity: 1 !important` e `backdrop-filter: none !important` em tudo dentro do wrapper.
3. **Zero `opacity: 0` isolado** para esconder conteúdo ou indicar desabilitado: usar cor tokenizada, `visibility`, `hidden` ou `inert`.
4. **Zero `backdrop-filter`** em qualquer superfície; popovers e menus são opacos (`--popover`).
5. **`--seeb-safe-right: 87px`** (20 + 55 + 12) em CTAs fixos à direita e barras inferiores (utility `.seeb-safe-end`). O FAB do SeeB fica, por padrão, em `right-center`; não competir com ele no eixo vertical central direito.
6. **`--z-max-app: 9990`**: nenhum `z-index` do app acima disso (o SeeB usa 999998 a 2147483647).
7. **Foco com anel duplo** em `:focus-visible` (já em `tokens.css`): `outline: 3px solid var(--ring); outline-offset: 3px; box-shadow: 0 0 0 3px var(--background), 0 0 0 6px var(--ring)`. Sobrevive a `invert()` e `contrast(1.5)`. Com Alt+J, o SeeB acrescenta o laranja `#FF6B00`.
8. **Não sincronizar o "modo escuro" do SeeB (Alt+D) com `.dark`**: o do SeeB é `filter: invert(0.9) hue-rotate(180deg)` no wrapper e não troca tokens; os dois juntos inverteriam um tema já escuro.
9. **Croma moderado de propósito** (o Alt+C aplica `contrast(1.5) saturate(1.5)`); tipografia em `rem`; `prefers-reduced-motion` respeitado; nada de atalho Alt+letra no app.
10. Voz do SeeB: a *utterance* usa `document.documentElement.lang`, mas o widget **prefere vozes `pt*`** ao escolher a voz; com `<html lang="es">` o texto pode sair com voz portuguesa. Documentar na página `/[locale]/accesibilidad`.

### 8.9 Briefing de logo e assets (o Claude Code gera; detalhe em `identidade-visual.md`, seção 7)

- **Conceito:** um **ponto de costura reto** + o **canto dobrado de uma ficha/caderno** (ou um laço mínimo de linha atravessando o canto de um cartão). Traço único, geométrico, sem folclore, sem máquina realista, sem degradê. Precisa funcionar a 16px (favicon), 20px (header mobile) e em uma cor (`currentColor`). Wordmark em IBM Plex Sans 600 com o nome de `src/config/brand.ts`.
- **Grid:** `logo-mark` `viewBox="0 0 32 32"` (grade 2×2, `stroke-width="2"` ou 1,75, `stroke-linecap/linejoin="round"`, `fill="none"`); logo horizontal `viewBox="0 0 160 32"`; versão de app icon `viewBox="0 0 48 48"`.
- **Arquivos:**
  - `brand/logo.svg` (colorido, só `#1C4066` + eventual `#4F2611` ou `#FEFCF8`), `brand/logo-mark.svg` (só o símbolo), `brand/logo-mono.svg` (`currentColor`).
  - Todos: `viewBox` sem `width`/`height` fixos, sem `<style>` interno, sem IDs duplicados, `role="img"` + `<title>` (ou `aria-hidden="true"` se decorativo ao lado de texto visível), otimizados com **SVGO**.
  - `src/app/icon.svg` (favicon 32, fundo opaco `#1C4066`, marca `#FEFCF8`) + `favicon.ico` de fallback.
  - `scripts/generate-icons.ts` (sharp) gera: `icon-192.png` (192×192), `icon-512.png` (512×512), `icon-512-maskable.png` (512×512, **safe zone central de 80%** = 409×409 px, marca dentro de um círculo de raio 204px, `purpose: "maskable"`) e `src/app/apple-icon.png` **180×180 opaco** (o iOS não usa o manifest). Fundo opaco `#1C4066`, marca creme.
  - `src/app/manifest.ts`: `name`, `short_name` ≤ 12, `start_url: "/?source=pwa"`, `display: "standalone"`, `background_color: "#FAF6EE"`, `theme_color: "#1C4066"`, `lang`, ícones 192 / 512 / 512 maskable, atalhos "Nuevo lote / Novo lote" e "Cobrar".
  - `src/app/[locale]/opengraph-image.tsx` (+ `twitter-image.tsx`) com `ImageResponse` de `next/og`, **1200×630, um por idioma**: fundo `#FAF6EE`, faixa/canto `#1C4066`, IBM Plex Sans 600/400 como `ArrayBuffer`, contraste AAA. Copy: **es** "El cuaderno de su taller. Registre, compruebe y cobre." + "R$ 35/mês" · **pt-BR** "O caderno do seu taller. Registre, comprove e cobre." + "R$ 35/mês". Sem fotos de pessoas reais, sem dados reais, sem QR Pix verdadeiro, sem concorrentes.
- Clear space mínimo: 2× a espessura do traço (ou ¼ da altura do símbolo, o que for maior). Fundos permitidos: `--background`, `--card`, `--primary`, `--foreground`.

**As 9 regras do Impeccable** (gravar no `/impeccable init` deste projeto):

1. Só tokens de `tokens.css`. Proibido hex hardcoded em componente (exceção: OG/ícones com os HEX validados desta paleta). Sem `bg-[#…]`, sem `text-blue-600` do Tailwind default, sem paleta "zinc/violet" residual do shadcn.
2. Sem AI slop: sem degradê roxo/neon, sem `backdrop-filter` em superfície crítica, sem sombra teatral, sem raio > `--radius-xl` em card, sem ilustração 3D genérica, sem folclore caricato.
3. Toque ≥ 48×48px; gap ≥ 12px entre ações opostas.
4. `tabular-nums` em todo valor em R$ e toda contagem de peças (`.tabular-money`).
5. Bordas nítidas de 1px/1,5px; hierarquia por borda, não por sombra.
6. Contraste: não clarear `--muted-foreground` abaixo de AA; não usar muted em dinheiro; não trocar pares já medidos.
7. SeeB: fundos opacos; sem `opacity` como único meio de esconder; portais dentro de `#app` / `#portal-root`; sem `z-index` > 9990; tipografia em rem; respeitar `prefers-reduced-motion`.
8. Bilinguismo e singular: copy nova em `es` e `pt-BR`, tratando o usuário no singular; `lang` correto em trechos mistos.
9. Auditoria: `/impeccable audit` nas telas `hoy`, produção/acerto, `cobros`, `cuenta` e no link público `/c/[token]`, nos dois temas e nos dois idiomas, antes do polish final.

> **Arquivos de referência:** o CSS pronto está em **`tokens.css`** (copiar para `src/styles/tokens.css` e importar no `globals.css` logo depois de `@import "tailwindcss";`). A matriz completa de 164 pares + daltonismo, a compatibilidade com o SeeB medida no código e o briefing detalhado de logo estão em **`identidade-visual.md`**.


---

*Fim do arquivo único de pesquisa e contexto. Pesquisa-base, planejamento e identidade visual (D1) de 13/11/2026 (horário de Brasília, UTC-3). Não invente o que a seção 1.12 marca como não encontrado ou não verificado.*
