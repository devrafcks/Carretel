/** CPF (dígito verificador), RNM/CRNM (formato) e telefone. Documentos são opcionais no produto. */
export function isValidCpf(raw: string): boolean {
  const cpf = raw.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

/** RNM: letra + 6 dígitos + verificador (ex.: V123456-7). Só formato. */
export function isValidRnm(raw: string): boolean {
  const s = raw.replace(/[\s.-]/g, "").toUpperCase();
  return /^[A-Z]\d{6}[A-Z0-9]$/.test(s);
}

export function isValidCnpj(raw: string): boolean {
  const c = raw.replace(/\D/g, "");
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const calc = (base: string) => {
    const weights = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = base.split("").reduce((acc, d, i) => acc + Number(d) * (weights[i] ?? 0), 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = calc(c.slice(0, 12));
  const d2 = calc(c.slice(0, 12) + d1);
  return d1 === Number(c[12]) && d2 === Number(c[13]);
}

/** Telefone BR → E.164 (+55…). null se não parecer telefone. */
export function toE164(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (!d) return null;
  const full = d.startsWith("55") && d.length >= 12 ? d : "55" + d;
  if (full.length < 12 || full.length > 13) return null;
  return "+" + full;
}
