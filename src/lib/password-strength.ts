/**
 * Força da senha com @zxcvbn-ts (sucessor mantido do zxcvbn do Dropbox).
 * A mesma regra roda no navegador (medidor no cadastro e na troca de senha) e no servidor
 * (src/app/api/auth/[...path]/route.ts, antes de repassar ao Neon Auth).
 *
 * A biblioteca e os dicionários (~1-2 MB) só carregam via import() dinâmico, na primeira checagem:
 * a página de login não fica mais pesada. No navegador carrega só o dicionário do idioma da tela.
 */
import type { OptionsGraph, ZxcvbnFactory, ZxcvbnResult } from "@zxcvbn-ts/core";

export const PASSWORD_MIN_LENGTH = 8;
/** Limite do Better Auth; também evita gastar CPU com textos enormes. */
export const PASSWORD_MAX_LENGTH = 128;
/**
 * Pontuação mínima do zxcvbn (0 a 4). 2 = "razoável" (~10^8 tentativas): com o limite de tentativas por IP e
 * por e-mail e o hash lento do Better Auth, é seguro e ainda deixa quem tem pouca prática com tecnologia
 * criar uma senha sem frustração. 3 obrigaria frases longas e geraria abandono no cadastro.
 */
export const PASSWORD_MIN_SCORE = 2;

export type StrengthLocale = "es" | "pt-BR";
export type Score = 0 | 1 | 2 | 3 | 4;

/** Dicas próprias (traduzidas em messages/*.json, namespace security.password). */
export type PasswordHint = "tooShort" | "tooLong" | "common" | "pattern" | "repeat" | "dates" | "names" | "personal" | "longer";

export type StrengthResult = { score: Score; ok: boolean; hint: PasswordHint | null };

/** Palavras do próprio app e do ramo: ninguém deve usar "carretel123" ou "costura2026". */
const APP_WORDS = ["carretel", "taller", "oficina", "costura", "costurera", "costureira", "confeccion", "confeccao", "bolivia", "saopaulo"];

const WARNING_HINT: Record<string, PasswordHint> = {
  topTen: "common",
  topHundred: "common",
  common: "common",
  similarToCommon: "common",
  pwned: "common",
  straightRow: "pattern",
  keyPattern: "pattern",
  sequences: "pattern",
  simpleRepeat: "repeat",
  extendedRepeat: "repeat",
  recentYears: "dates",
  dates: "dates",
  wordByItself: "names",
  namesByThemselves: "names",
  commonNames: "names",
  userInputs: "personal",
};

/** Regra pura (testada): junta tamanho + resultado do zxcvbn numa decisão e numa dica. */
export function judgePassword(password: string, score: number, warning: string | null): StrengthResult {
  if (password.length < PASSWORD_MIN_LENGTH) return { score: 0, ok: false, hint: "tooShort" };
  if (password.length > PASSWORD_MAX_LENGTH) return { score: 0, ok: false, hint: "tooLong" };
  const s = Math.max(0, Math.min(4, Math.trunc(score))) as Score;
  const ok = s >= PASSWORD_MIN_SCORE;
  const mapped = warning ? WARNING_HINT[warning] ?? null : null;
  return { score: s, ok, hint: ok ? (s < 3 ? mapped : null) : mapped ?? "longer" };
}

/** Dados da própria pessoa que não devem aparecer na senha (e-mail, parte antes do @, nome). */
export function personalInputs(email?: string | null, name?: string | null): string[] {
  const out = new Set<string>(APP_WORDS);
  const mail = (email ?? "").trim().toLowerCase();
  if (mail) {
    out.add(mail);
    const local = mail.split("@")[0] ?? "";
    if (local) out.add(local);
    for (const part of local.split(/[._+-]+/)) if (part.length >= 3) out.add(part);
  }
  for (const part of (name ?? "").toLowerCase().split(/\s+/)) if (part.length >= 3) out.add(part);
  return [...out];
}

const factories = new Map<string, Promise<ZxcvbnFactory>>();

async function loadFactory(locales: readonly StrengthLocale[]): Promise<ZxcvbnFactory> {
  const key = [...locales].sort().join("+");
  let f = factories.get(key);
  if (!f) {
    f = (async () => {
      const [{ ZxcvbnFactory }, common, ...langs] = await Promise.all([
        // entradas ESM explícitas: o build CJS desses pacotes quebra com @zxcvbn-ts/dictionary-compression 3
        // ("decompress is not a function") quando o Node/Vitest escolhe o "main" (tipos em src/types/zxcvbn-esm.d.ts)
        import("@zxcvbn-ts/core/dist/index.mjs"),
        import("@zxcvbn-ts/language-common/dist/index.mjs"),
        ...locales.map((l) => (l === "pt-BR" ? import("@zxcvbn-ts/language-pt-br/dist/index.mjs") : import("@zxcvbn-ts/language-es-es/dist/index.mjs"))),
      ]);
      const dictionary = Object.assign({}, common.dictionary, ...langs.map((l) => l.dictionary));
      // o pacote reexporta o JSON como namespace ({ default: grafos }) no build ESM
      const rawGraphs = common.adjacencyGraphs as unknown as Record<string, unknown>;
      const graphs = (rawGraphs.default && typeof rawGraphs.default === "object" ? rawGraphs.default : rawGraphs) as OptionsGraph;
      return new ZxcvbnFactory({ dictionary, graphs, useLevenshteinDistance: true });
    })();
    f.catch(() => factories.delete(key));
    factories.set(key, f);
  }
  return f;
}

/** Começa a baixar a biblioteca (ex.: ao focar no campo de senha), sem esperar. */
export function preloadPasswordChecker(locales: readonly StrengthLocale[]): void {
  void loadFactory(locales).catch(() => {});
}

/**
 * Avalia a senha. `locales`: no navegador, só o idioma da tela (peso menor); no servidor, os dois.
 * Erro ao carregar a biblioteca → cai só na regra de tamanho (nunca trava o cadastro por falha nossa).
 */
export async function checkPassword(
  password: string,
  opts: { locales: readonly StrengthLocale[]; email?: string | null; name?: string | null },
): Promise<StrengthResult> {
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) return judgePassword(password, 0, null);
  let result: ZxcvbnResult;
  try {
    const zxcvbn = await loadFactory(opts.locales);
    result = zxcvbn.check(password, personalInputs(opts.email, opts.name));
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "zxcvbn_load_failed", err: String(err) }));
    return { score: 2, ok: true, hint: null };
  }
  return judgePassword(password, result.score, result.feedback.warning);
}
