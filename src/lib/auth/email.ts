/**
 * E-mails do login (código de 6 números do "Esqueci minha senha") por SMTP — por padrão o Gmail do dono
 * (grátis, até ~500 por dia, entrega para qualquer endereço, sem domínio próprio).
 *   SMTP_USER=seuemail@gmail.com   SMTP_PASS=senha de app do Google (16 letras)
 *   opcionais: SMTP_HOST (smtp.gmail.com), SMTP_PORT (465), EMAIL_FROM_NAME (Carretel)
 * Sem SMTP configurado (desenvolvimento) o código só aparece no console do servidor.
 */
import "server-only";
import nodemailer from "nodemailer";
import { appUrl } from "@/config/brand";
import { legal } from "@/config/legal";
import { codeEmailHtml, codeEmailText } from "./email-template";
import { logError } from "@/server/log";

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

/** Há envio de e-mail configurado? Sem ele, o código de troca de senha é gerado pelo admin. */
export function emailEnabled(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendAuthCode(email: string, otp: string, type: string, locale: "pt-BR" | "es" = "pt-BR") {
  const subject = SUBJECT[type]?.[locale] ?? SUBJECT["forget-password"]![locale];
  const t = smtp();
  if (!t) {
    console.info(`\n[carretel] ${subject} para ${email}: ${otp}\n`);
    return;
  }
  const data = {
    locale,
    subject,
    code: otp,
    minutes: 30,
    actionUrl: `${appUrl()}/${locale}/esqueci-senha?email=${encodeURIComponent(email)}&codigo=1`,
    supportEmail: legal.supportEmail,
    cnpj: legal.cnpj,
  };
  try {
    await t.sendMail({
      from: { name: process.env.EMAIL_FROM_NAME || "Carretel", address: process.env.SMTP_USER! },
      to: email,
      subject,
      text: codeEmailText(data),
      html: codeEmailHtml(data),
    });
  } catch (err) {
    await logError("auth_email_failed", err, { source: "email", lookupRequest: false });
    throw new Error("email_failed");
  }
}
