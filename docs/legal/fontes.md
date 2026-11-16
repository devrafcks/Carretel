# Fontes legais — conferência pendente

Regra do projeto: nenhuma afirmação legal entra na UI sem o trecho exato, o link oficial e o aviso de vigência registrados aqui.

Estado em 14/11/2026: o servidor `leis-mcp` não pôde ser instalado neste ambiente (o `uv` não está disponível no Windows da máquina de desenvolvimento). Por isso **nenhuma norma abaixo foi conferida ainda**. Os textos legais publicados (`/privacidad`, `/terminos`, `/quienes-somos`) estão marcados como rascunho e não citam artigos. As únicas menções a artigos na UI são as duas que vieram aprovadas no briefing (CLT art. 78 no alerta educativo do acerto e CDC art. 49 na garantia do Pix Automático); ambas precisam ser conferidas aqui antes do go-live.

Como conferir (por norma): `buscar_norma` → `ler_artigo` → colar abaixo o trecho exato, o campo `fonte` (link oficial) e o aviso de vigência.

| # | Norma | Uso no produto | Status |
|---|---|---|---|
| 1 | CLT art. 78 + valor vigente do salário mínimo (decreto) | Alerta educativo do piso diário; `legal_params.minimum_wage_monthly_cents` com `valid_from` e fonte | Valor conferido em 16/11/2026: R$ 1.621,00 desde 01/01/2026, [Decreto nº 12.797/2025, art. 1º](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/D12797.htm) (migração `0008`). CLT art. 78: pendente |
| 2 | Marco Civil da Internet (Lei 12.965/2014) art. 15 | Guarda de logs de acesso por 6 meses (`access_audit_logs`, cron `retention`) | Pendente |
| 3 | LGPD (Lei 13.709/2018) — operador/controlador, encarregado, art. 18 | Política de privacidade, exportação e exclusão de conta | Pendente |
| 4 | CDC (Lei 8.078/1990) art. 49 | Arrependimento em 7 dias (cancelar e pedir reembolso) | Pendente |
| 5 | Decreto 7.962/2013 arts. 2º, 4º e 5º | Identificação no rodapé, resumo/confirmação, cancelamento pelo mesmo meio | Pendente |
| 6 | Lei 13.429/2017 (Lei 6.019/1974, art. 5º-A, §5º) | Orientação sobre cadeia de subcontratação | Pendente |
| 7 | Código Penal art. 149 | Declaração contra trabalho forçado no onboarding | Pendente |
| 8 | Lei SP 14.946/2013 | Argumento B2B de rastreabilidade (fora da UI no MVP) | Pendente |
| 9 | MP 2.200-2/2001 art. 10, §2º | Força probatória do aceite eletrônico simples no link público | Pendente |
| 10 | Res. CGSN 140/2018 arts. 112 e 114 | Dicas de MEI (fora da UI no MVP) | Pendente |

Toda saída jurídica permanece marcada como **rascunho — revisar com advogado** até a aprovação do Rafael (item D5).
