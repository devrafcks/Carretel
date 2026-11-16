/**
 * E-mails do login (código de 6 números do "Esqueci minha senha") pelo Resend.
 * Sem RESEND_API_KEY (desenvolvimento) o código só aparece no console do servidor.
 * Atenção: sem domínio verificado no Resend, ele só entrega para o e-mail dono da conta Resend.
 */
import "server-only";

const SUBJECT: Record<string, Record<"pt-BR" | "es", string>> = {
  "forget-password": { "pt-BR": "Seu código para trocar a senha", es: "Su código para cambiar la contraseña" },
  "sign-in": { "pt-BR": "Seu código de acesso", es: "Su código de acceso" },
  "email-verification": { "pt-BR": "Confirme seu e-mail", es: "Confirme su correo" },
};

export async function sendAuthCode(email: string, otp: string, type: string, locale: "pt-BR" | "es" = "pt-BR") {
  const key = process.env.RESEND_API_KEY;
  const subject = SUBJECT[type]?.[locale] ?? SUBJECT["forget-password"]![locale];
  if (!key) {
    console.info(`\n[carretel] ${subject} para ${email}: ${otp}\n`);
    return;
  }
  const lead = locale === "es" ? "Use este código en Carretel. Vence en 10 minutos." : "Use este código no Carretel. Ele vale por 10 minutos.";
  const ignore = locale === "es" ? "Si no lo pidió usted, ignore este correo." : "Se não foi você que pediu, ignore este e-mail.";
  const html = `<!doctype html><html><body style="margin:0;background:#f4f7f5;font-family:Arial,Helvetica,sans-serif;color:#121815">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:20px;padding:32px">
<tr><td style="font-size:18px;font-weight:bold">carretel</td></tr>
<tr><td style="padding-top:20px;font-size:16px">${subject}</td></tr>
<tr><td style="padding-top:8px;font-size:14px;color:#515b57">${lead}</td></tr>
<tr><td style="padding-top:24px"><div style="font-size:34px;letter-spacing:10px;font-weight:bold;background:#eafaf0;border-radius:14px;padding:16px;text-align:center">${otp}</div></td></tr>
<tr><td style="padding-top:24px;font-size:12px;color:#515b57">${ignore}</td></tr>
</table></td></tr></table></body></html>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || "Carretel <onboarding@resend.dev>", to: [email], subject, html, text: `${subject}: ${otp}\n${lead}` }),
  });
  if (!res.ok) {
    console.error(JSON.stringify({ level: "error", msg: "auth_email_failed", status: res.status, body: (await res.text()).slice(0, 300) }));
    throw new Error("email_failed");
  }
}
