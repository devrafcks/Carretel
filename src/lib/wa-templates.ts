/** Templates de WhatsApp (educados e firmes, singular, sem acusar). Idioma = do contratante / do costureiro. */
import { formatBRL } from "./money";
import { sortSizes } from "./utils";

type Loc = "es" | "pt-BR";

function gridText(grid: Record<string, number> | null | undefined): string {
  if (!grid) return "";
  const parts = sortSizes(grid).filter(([, n]) => n > 0).map(([k, n]) => `${k} ${n}`);
  return parts.length ? ` (${parts.join(" · ")})` : "";
}

export function proofMessage(loc: Loc, d: { client: string; workshop: string; quantity: number; reference: string | null; grid?: Record<string, number> | null; amountCents: number; url: string }) {
  const ref = d.reference ? (loc === "es" ? ` de la ref. ${d.reference}` : ` da ref. ${d.reference}`) : "";
  const amount = formatBRL(d.amountCents, "pt-BR");
  return loc === "es"
    ? `¡Hola, ${d.client}! Le escribe ${d.workshop}. Hoy entregamos ${d.quantity} piezas${ref}${gridText(d.grid)}. Valor: ${amount}. Por favor, confirme el recibimiento en este enlace: ${d.url}. ¡Gracias!`
    : `Olá, ${d.client}! Aqui é o ${d.workshop}. Entregamos hoje ${d.quantity} peças${ref}${gridText(d.grid)}. Valor: ${amount}. Por favor, confirme o recebimento neste link: ${d.url}. Obrigado!`;
}

export function chargeMessage(loc: Loc, d: { client: string; amountCents: number; deliveredOn: string; days: number; pix: string | null; url: string }) {
  const amount = formatBRL(d.amountCents, "pt-BR");
  const pix = d.pix ? (loc === "es" ? ` Pix copia y pega: ${d.pix}.` : ` Pix copia e cola: ${d.pix}.`) : "";
  return loc === "es"
    ? `¡Hola, ${d.client}! Le escribo para recordarle el pago de ${amount} de la entrega del ${d.deliveredOn} (hace ${d.days} ${d.days === 1 ? "día" : "días"}).${pix} Comprobante: ${d.url}. ¡Gracias!`
    : `Olá, ${d.client}! Passando para lembrar do pagamento de ${amount} da entrega de ${d.deliveredOn} (há ${d.days} ${d.days === 1 ? "dia" : "dias"}).${pix} Comprovante: ${d.url}.`;
}

export function receiptMessage(loc: Loc, d: { worker: string; grossCents: number; advancesCents: number; netCents: number; url: string }) {
  const f = (c: number) => formatBRL(c, "pt-BR");
  return loc === "es"
    ? `${d.worker}, su pago de la semana: producción ${f(d.grossCents)} − adelantos ${f(d.advancesCents)} = ${f(d.netCents)}. Detalle: ${d.url}`
    : `${d.worker}, seu acerto da semana: produção ${f(d.grossCents)} − vales ${f(d.advancesCents)} = ${f(d.netCents)}. Detalhe: ${d.url}`;
}
