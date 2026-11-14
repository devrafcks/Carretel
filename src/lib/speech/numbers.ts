/**
 * Parser de números falados em ES e PT-BR (voz por campo).
 * O resultado SEMPRE vai para um campo editável antes de salvar.
 *
 *  - quantidade: "trescientas" → 300 · "mil doscientos" → 1200 · "trezentas e cinquenta" → 350
 *  - dinheiro:   "dos cincuenta" → 250 (centavos) · "dois e cinquenta" → 250 · "tres reales" → 300
 *                "2,50" / "2.50" / "R$ 3" também funcionam
 */

const UNITS: Record<string, number> = {
  // ES
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20, veintiun: 21, veintiuno: 21, veintiuna: 21, veintidos: 22,
  veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28,
  veintinueve: 29, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80,
  noventa: 90, cien: 100, ciento: 100, doscientos: 200, doscientas: 200, trescientos: 300,
  trescientas: 300, cuatrocientos: 400, cuatrocientas: 400, quinientos: 500, quinientas: 500,
  seiscientos: 600, seiscientas: 600, setecientos: 700, setecientas: 700, ochocientos: 800,
  ochocientas: 800, novecientos: 900, novecientas: 900,
  // PT
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, "tres_pt": 3, quatro: 4, sete: 7, oito: 8, nove: 9,
  dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze_pt: 14, quinze_pt: 15, dezesseis: 16,
  dezasseis: 16, dezessete: 17, dezoito: 18, dezenove: 19, vinte: 20, trinta: 30, quarenta: 40,
  cinquenta: 50, sessenta: 60, setenta_pt: 70, oitenta: 80, noventa_pt: 90, cem: 100, cento: 100,
  duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300, quatrocentos: 400, quatrocentas: 400,
  quinhentos: 500, quinhentas: 500, seiscentos_pt: 600, seiscentas_pt: 600, setecentos_pt: 700,
  setecentas_pt: 700, oitocentos: 800, oitocentas: 800, novecentos_pt: 900, novecentas_pt: 900,
};

const CONNECTORS = new Set(["y", "e", "con", "com"]);
const MONEY_UNITS = new Set(["real", "reales", "reais", "pesos", "rs"]);
const CENT_UNITS = new Set(["centavo", "centavos", "centimo", "centimos"]);
const NOISE = new Set([
  "piezas", "pieza", "pzs", "pecas", "peca", "unidades", "por", "cada", "a", "de", "el", "la", "o", "precio",
  "preco", "son", "sao", "total", "mas", "mais", "menos",
]);

export function normalizeSpeech(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/r\$/g, " rs ")
    .replace(/[^a-z0-9,.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordValue(w: string): number | undefined {
  if (w in UNITS) return UNITS[w];
  return UNITS[`${w}_pt`];
}

/** Converte uma sequência de palavras numéricas em inteiro (até milhões). */
export function wordsToInteger(words: string[]): number | null {
  let total = 0;
  let current = 0;
  let seen = false;
  for (const raw of words) {
    const w = raw.trim();
    if (!w || CONNECTORS.has(w) || NOISE.has(w)) continue;
    if (/^\d+$/.test(w)) {
      current += Number(w);
      seen = true;
      continue;
    }
    if (w === "mil") {
      total += (current || 1) * 1000;
      current = 0;
      seen = true;
      continue;
    }
    if (w === "millon" || w === "millones" || w === "milhao" || w === "milhoes") {
      total += (current || 1) * 1_000_000;
      current = 0;
      seen = true;
      continue;
    }
    const v = wordValue(w);
    if (v === undefined) return null;
    current += v;
    seen = true;
  }
  return seen ? total + current : null;
}

/** Quantidade inteira (peças). */
export function parseSpokenInteger(text: string): number | null {
  const t = normalizeSpeech(text);
  if (!t) return null;
  const digits = t.replace(/[.,](?=\d{3}\b)/g, "").match(/^\d+$/);
  if (digits) return Number(digits[0]);
  const firstNum = t.match(/\d[\d.]*/);
  if (firstNum && !/[a-z]{3,}/.test(t.replace(/piezas|pieza|pzs|pecas|peca|unidades/g, ""))) {
    return Number(firstNum[0].replace(/\./g, ""));
  }
  return wordsToInteger(t.split(" "));
}

/** Valor em centavos ("dos cincuenta" → 250). */
export function parseSpokenMoney(text: string): number | null {
  const t = normalizeSpeech(text);
  if (!t) return null;
  const numeric = t.match(/(\d+)(?:[.,](\d{1,2}))?/);
  if (numeric && !/[a-z]{4,}/.test(t.replace(/\b(rs|reales|reais|real|centavos?)\b/g, ""))) {
    const reais = Number(numeric[1]);
    const cents = numeric[2] ? Number(numeric[2].padEnd(2, "0")) : 0;
    return reais * 100 + cents;
  }
  const words = t.split(" ").filter((w) => w && !NOISE.has(w));
  // separa a parte de reais da parte de centavos
  const moneyIdx = words.findIndex((w) => MONEY_UNITS.has(w));
  if (moneyIdx >= 0) {
    const reais = wordsToInteger(words.slice(0, moneyIdx));
    const rest = words.slice(moneyIdx + 1).filter((w) => !CENT_UNITS.has(w));
    const cents = rest.length ? wordsToInteger(rest) : 0;
    if (reais === null || cents === null) return null;
    return reais * 100 + cents;
  }
  // "dos cincuenta" / "dois e cinquenta": primeiro grupo = reais, resto = centavos
  const groups: string[][] = [];
  let cur: string[] = [];
  for (const w of words) {
    if (CONNECTORS.has(w)) {
      if (cur.length) groups.push(cur);
      cur = [];
      continue;
    }
    const v = wordValue(w);
    // um número < 10 seguido de dezena inicia o grupo de centavos ("dos cincuenta")
    if (cur.length === 1 && v !== undefined && v >= 10 && v < 100) {
      const prev = wordValue(cur[0]!);
      if (prev !== undefined && prev < 10) {
        groups.push(cur);
        cur = [w];
        continue;
      }
    }
    cur.push(w);
  }
  if (cur.length) groups.push(cur);
  if (groups.length === 1) {
    const n = wordsToInteger(groups[0]!);
    return n === null ? null : n * 100;
  }
  if (groups.length === 2) {
    const reais = wordsToInteger(groups[0]!);
    const cents = wordsToInteger(groups[1]!.filter((w) => !CENT_UNITS.has(w)));
    if (reais === null || cents === null || cents > 99) return null;
    return reais * 100 + cents;
  }
  return null;
}

const WEEKDAYS: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6,
  segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5,
};

/** Prazo falado → data ISO (YYYY-MM-DD) a partir de `today` (em America/Sao_Paulo). */
export function parseSpokenDate(text: string, today: Date): string | null {
  const t = normalizeSpeech(text);
  if (!t) return null;
  const add = (days: number) => {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + days));
    return d.toISOString().slice(0, 10);
  };
  if (/\b(hoy|hoje)\b/.test(t)) return add(0);
  if (/\bpasado manana\b|\bdepois de amanha\b/.test(t)) return add(2);
  if (/\b(manana|amanha)\b/.test(t)) return add(1);
  const inDays = t.match(/(?:en|em|dentro de)\s+(\S+(?:\s\S+)?)\s+(?:dias?)/);
  if (inDays) {
    const n = /^\d+$/.test(inDays[1]!) ? Number(inDays[1]) : wordsToInteger(inDays[1]!.split(" "));
    if (n !== null && n > 0 && n < 366) return add(n);
  }
  const weeks = t.match(/(?:en|em)\s+(\S+)\s+semanas?/);
  if (weeks) {
    const n = /^\d+$/.test(weeks[1]!) ? Number(weeks[1]) : wordsToInteger([weeks[1]!]);
    if (n !== null && n > 0) return add(n * 7);
  }
  for (const [name, dow] of Object.entries(WEEKDAYS)) {
    if (new RegExp(`\\b${name}\\b`).test(t)) {
      const diff = (dow - today.getUTCDay() + 7) % 7 || 7;
      return add(diff);
    }
  }
  const dm = t.match(/\b(\d{1,2})[\/\s](\d{1,2})(?:[\/\s](\d{2,4}))?\b/);
  if (dm) {
    const day = Number(dm[1]);
    const month = Number(dm[2]);
    let year = dm[3] ? Number(dm[3]) : today.getUTCFullYear();
    if (year < 100) year += 2000;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  return null;
}

/** Cadeia de idiomas para a Web Speech API. */
export function speechLangChain(locale: string): string[] {
  return locale === "pt-BR" ? ["pt-BR"] : ["es-BO", "es-419", "es-US", "es-ES"];
}
