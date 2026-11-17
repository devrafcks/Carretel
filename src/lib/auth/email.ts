/**
 * E-mails do login (código de 6 números do "Esqueci minha senha") por SMTP — por padrão o Gmail do dono
 * (grátis, até ~500 por dia, entrega para qualquer endereço, sem domínio próprio).
 *   SMTP_USER=seuemail@gmail.com   SMTP_PASS=senha de app do Google (16 letras)
 *   opcionais: SMTP_HOST (smtp.gmail.com), SMTP_PORT (465), EMAIL_FROM_NAME (Carretel)
 * Sem SMTP configurado (desenvolvimento) o código só aparece no console do servidor.
 */
import "server-only";
import nodemailer from "nodemailer";

const SUBJECT: Record<string, Record<"pt-BR" | "es", string>> = {
  "forget-password": { "pt-BR": "Seu código para trocar a senha", es: "Su código para cambiar la contraseña" },
  "sign-in": { "pt-BR": "Seu código de acesso", es: "Su código de acceso" },
  "email-verification": { "pt-BR": "Confirme seu e-mail", es: "Confirme su correo" },
};

let transport: nodemailer.Transporter | null = null;
function smtp(): nodemailer.Transporter | null {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 465);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user, pass: pass.replace(/\s+/g, "") }, // a senha de app do Google vem com espaços
    });
  }
  return transport;
}

export async function sendAuthCode(email: string, otp: string, type: string, locale: "pt-BR" | "es" = "pt-BR") {
  const subject = SUBJECT[type]?.[locale] ?? SUBJECT["forget-password"]![locale];
  const t = smtp();
  if (!t) {
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
  try {
    await t.sendMail({
      from: { name: process.env.EMAIL_FROM_NAME || "Carretel", address: process.env.SMTP_USER! },
      to: email,
      subject,
      text: `${subject}: ${otp}\n${lead}\n${ignore}`,
      html,
    });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "auth_email_failed", err: String(err).slice(0, 300) }));
    throw new Error("email_failed");
  }
}
