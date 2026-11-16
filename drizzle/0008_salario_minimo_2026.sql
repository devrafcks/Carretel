-- Salário mínimo vigente (alerta educativo CLT art. 78 no acerto). Fonte conferida no Planalto em 16/11/2026:
-- Decreto nº 12.797/2025, art. 1º: "A partir de 1º de janeiro de 2026, o valor do salário mínimo será de R$ 1.621,00".
INSERT INTO "legal_params" ("key", "value_cents", "valid_from", "source")
VALUES ('minimum_wage_monthly_cents', 162100, '2026-01-01', 'Decreto nº 12.797/2025 (https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/D12797.htm)')
ON CONFLICT ("key", "valid_from") DO NOTHING;
