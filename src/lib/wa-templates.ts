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

export function proofReminderMessage(loc: Loc, d: { client: string; workshop: string; amountCents: number; deliveredOn: string; url: string }) {
  const amount = formatBRL(d.amountCents, "pt-BR");
  return loc === "es"
    ? `¡Hola, ${d.client}! Le escribe ${d.workshop}. Le reenvío el comprobante de la entrega del ${d.deliveredOn} (${amount}). Cuando pueda, confirme el recibimiento en este enlace: ${d.url}. ¡Gracias!`
    : `Olá, ${d.client}! Aqui é o ${d.workshop}. Reenvio o comprovante da entrega de ${d.deliveredOn} (${amount}). Quando puder, confirme o recebimento neste link: ${d.url}. Obrigado!`;
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

/* ───── Lembrete de cobrança (várias entregas de um cliente, tom gentil ou firme) ───── */
export type ReminderTone = "gentle" | "firm";

export interface ReminderItem {
  deliveredOn: string; // já formatada (dd/mm)
  quantity: number | null;
  reference: string | null;
  amountCents: number;
  url: string;
}

/**
 * Mensagem pronta para a oficina mandar pelo próprio WhatsApp (copiar ou wa.me). Sem envio automático.
 * Uma linha por entrega (data, peças, ref., valor, link do comprovante), total e Pix copia e cola.
 */
export function reminderMessage(
  loc: Loc,
  tone: ReminderTone,
  d: { client: string; workshop: string; items: ReminderItem[]; totalCents: number; oldestDays: number; pix: string | null },
): string {
  const f = (c: number) => formatBRL(c, "pt-BR");
  const es = loc === "es";
  const line = (i: ReminderItem) => {
    const pcs = i.quantity ? (es ? ` · ${i.quantity} piezas` : ` · ${i.quantity} peças`) : "";
    const ref = i.reference ? ` · ref. ${i.reference}` : "";
    return `• ${i.deliveredOn}${pcs}${ref} · ${f(i.amountCents)}\n  ${es ? "Comprobante" : "Comprovante"}: ${i.url}`;
  };
  const list = d.items.map(line).join("\n");
  const one = d.items.length === 1;
  const days = d.oldestDays;
  const pix = d.pix ? (es ? `\n\nPix copia y pega:\n${d.pix}` : `\n\nPix copia e cola:\n${d.pix}`) : "";

  if (es) {
    return tone === "gentle"
      ? `¡Hola, ${d.client}! Le escribe ${d.workshop}. Le paso el resumen ${one ? "de la entrega pendiente de pago" : "de las entregas pendientes de pago"}:\n\n${list}\n\nTotal: ${f(d.totalCents)}${pix}\n\nCualquier duda, me avisa. ¡Muchas gracias!`
      : `Hola, ${d.client}. Le escribe ${d.workshop}. ${one ? "La entrega de abajo está pendiente" : "Las entregas de abajo están pendientes"} de pago${days > 0 ? ` hace ${days} ${days === 1 ? "día" : "días"}` : ""}:\n\n${list}\n\nTotal pendiente: ${f(d.totalCents)}${pix}\n\nLe pido que haga el pago hoy. Si ya pagó, por favor envíeme el comprobante.`;
  }
  return tone === "gentle"
    ? `Olá, ${d.client}! Aqui é o ${d.workshop}. Segue o resumo ${one ? "da entrega em aberto" : "das entregas em aberto"}:\n\n${list}\n\nTotal: ${f(d.totalCents)}${pix}\n\nQualquer dúvida, é só chamar. Obrigado!`
    : `Olá, ${d.client}. Aqui é o ${d.workshop}. ${one ? "A entrega abaixo está" : "As entregas abaixo estão"} sem pagamento${days > 0 ? ` há ${days} ${days === 1 ? "dia" : "dias"}` : ""}:\n\n${list}\n\nTotal em aberto: ${f(d.totalCents)}${pix}\n\nPeço que o pagamento seja feito hoje. Se já pagou, por favor me envie o comprovante.`;
}
