/**
 * Pix BR Code estático com valor (EMV MPM), sem API de banco.
 * Campos: 00 payload format, 26 merchant account (GUI br.gov.bcb.pix + chave),
 * 52 MCC 0000, 53 moeda 986, 54 valor, 58 país BR, 59 nome, 60 cidade,
 * 62 dados adicionais (05 txid), 63 CRC16-CCITT (poly 0x1021, init 0xFFFF).
 */
export interface PixInput {
  key: string;
  merchantName: string;
  merchantCity: string;
  amountCents?: number;
  txid?: string;
  description?: string;
}

function tlv(id: string, value: string): string {
  const len = value.length;
  if (len > 99) throw new Error(`campo ${id} excede 99 caracteres`);
  return `${id}${String(len).padStart(2, "0")}${value}`;
}

export function crc16ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Remove acentos e caracteres fora do conjunto permitido do EMV. */
export function sanitizeEmvText(s: string, max: number): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 .\-/@]/g, "")
    .trim()
    .slice(0, max);
}

export function normalizePixKey(key: string, type?: string): string {
  const k = key.trim();
  if (type === "cpf" || type === "cnpj") return k.replace(/\D/g, "");
  if (type === "phone") {
    const digits = k.replace(/\D/g, "");
    return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
  }
  if (type === "email") return k.toLowerCase();
  return k;
}

export function buildPixBrCode(input: PixInput): string {
  const key = input.key.trim();
  if (!key) throw new Error("pix_key_missing");
  const name = sanitizeEmvText(input.merchantName, 25) || "RECEBEDOR";
  const city = sanitizeEmvText(input.merchantCity, 15).toUpperCase() || "SAO PAULO";
  const txid = (input.txid ? input.txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) : "") || "***";

  let mai = tlv("00", "br.gov.bcb.pix") + tlv("01", key);
  if (input.description) {
    const desc = sanitizeEmvText(input.description, 40);
    if (desc && mai.length + desc.length + 4 <= 99) mai += tlv("02", desc);
  }

  let payload =
    tlv("00", "01") +
    tlv("26", mai) +
    tlv("52", "0000") +
    tlv("53", "986");
  if (input.amountCents && input.amountCents > 0) {
    payload += tlv("54", (input.amountCents / 100).toFixed(2));
  }
  payload += tlv("58", "BR") + tlv("59", name) + tlv("60", city) + tlv("62", tlv("05", txid));
  payload += "6304";
  return payload + crc16ccitt(payload);
}

/** Valida CRC de um BR Code existente. */
export function isValidBrCode(code: string): boolean {
  if (code.length < 8) return false;
  const body = code.slice(0, -4);
  return body.endsWith("6304") && crc16ccitt(body) === code.slice(-4).toUpperCase();
}
