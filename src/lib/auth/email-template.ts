/**
 * HTML do e-mail do código (troca de senha / acesso). Feito para clientes de e-mail:
 * tabelas, estilos inline, fontes seguras, só tema claro e um texto escondido de pré-visualização.
 */
export type CodeEmail = {
  locale: "pt-BR" | "es";
  subject: string;
  code: string;
  minutes: number;
  actionUrl: string;
  supportEmail: string;
  cnpj: string;
};

const C = {
  ink: "#121815",
  muted: "#515b57",
  line: "#e3ebe6",
  bg: "#f2f6f3",
  mint: "#eafaf0",
  mintStrong: "#d2f5e1",
  green: "#1f855d",
  greenDark: "#0b6545",
  white: "#ffffff",
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function codeEmailHtml(e: CodeEmail): string {
  const pt = e.locale === "pt-BR";
  const L = {
    preheader: pt ? `Seu código: ${e.code}. Vale por ${e.minutes} minutos.` : `Su código: ${e.code}. Vale ${e.minutes} minutos.`,
    hello: pt ? "Olá!" : "¡Hola!",
    lead: pt
      ? "Recebemos um pedido para criar uma senha nova na sua conta do Carretel. Use o código abaixo:"
      : "Recibimos un pedido para crear una contraseña nueva en su cuenta de Carretel. Use el código de abajo:",
    valid: pt ? `Vale por ${e.minutes} minutos e só pode ser usado uma vez.` : `Vale ${e.minutes} minutos y se usa una sola vez.`,
    button: pt ? "Criar minha senha nova" : "Crear mi contraseña nueva",
    howTitle: pt ? "Como usar" : "Cómo usarlo",
    steps: pt
      ? ["Toque no botão acima (ou abra “Esqueci minha senha”).", "Digite o código de 6 números.", "Escolha a senha nova e pronto."]
      : ["Toque el botón de arriba (o abra “Olvidé mi contraseña”).", "Escriba el código de 6 números.", "Elija la contraseña nueva y listo."],
    safeTitle: pt ? "Não foi você?" : "¿No fue usted?",
    safe: pt
      ? "Pode ignorar este e-mail: sua senha continua a mesma. Nunca passe este código para ninguém, nem para quem diz ser do Carretel."
      : "Puede ignorar este correo: su contraseña sigue igual. Nunca pase este código a nadie, ni a quien diga ser de Carretel.",
    help: pt ? "Dúvidas? Responda este e-mail ou escreva para" : "¿Dudas? Responda este correo o escriba a",
    tagline: pt ? "O caderno do seu taller." : "El cuaderno de su taller.",
  };
  const digits = e.code
    .split("")
    .map(
      (d) =>
        `<td align="center" style="width:40px;height:54px;background:${C.white};border:1px solid ${C.mintStrong};border-radius:12px;font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:bold;color:${C.ink}">${esc(d)}</td><td style="width:6px"></td>`,
    )
    .join("");

  return `<!doctype html>
<html lang="${e.locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${esc(e.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.bg}">${esc(L.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}">
<tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px">

    <!-- marca -->
    <tr><td style="background:${C.ink};border-radius:20px 20px 0 0;padding:22px 28px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="width:30px;height:30px;background:${C.green};border-radius:15px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:${C.white}">C</td>
        <td style="padding-left:10px;font-family:Arial,Helvetica,sans-serif;font-size:19px;font-weight:bold;color:${C.white};letter-spacing:-0.2px">carretel</td>
      </tr></table>
    </td></tr>

    <!-- corpo -->
    <tr><td style="background:${C.white};padding:30px 28px 8px;font-family:Arial,Helvetica,sans-serif;color:${C.ink}">
      <p style="margin:0;font-size:22px;font-weight:bold">${esc(e.subject)}</p>
      <p style="margin:14px 0 0;font-size:15px;line-height:22px;color:${C.muted}">${esc(L.hello)} ${esc(L.lead)}</p>
    </td></tr>

    <!-- código -->
    <tr><td style="background:${C.white};padding:18px 28px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.mint};border-radius:16px">
        <tr><td align="center" style="padding:22px 12px 8px">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>${digits}</tr></table>
        </td></tr>
        <tr><td align="center" style="padding:6px 16px 20px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.greenDark}">${esc(L.valid)}</td></tr>
      </table>
    </td></tr>

    <!-- botão -->
    <tr><td align="center" style="background:${C.white};padding:24px 28px 6px">
      <a href="${esc(e.actionUrl)}" style="display:inline-block;background:${C.ink};color:${C.white};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:15px 28px;border-radius:999px">${esc(L.button)}</a>
    </td></tr>

    <!-- como usar -->
    <tr><td style="background:${C.white};padding:22px 28px 6px;font-family:Arial,Helvetica,sans-serif">
      <p style="margin:0 0 10px;font-size:13px;font-weight:bold;color:${C.ink};text-transform:uppercase;letter-spacing:0.6px">${esc(L.howTitle)}</p>
      ${L.steps
        .map(
          (s, i) =>
            `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px"><tr><td valign="top" style="width:24px"><div style="width:24px;height:24px;background:${C.mint};border-radius:12px;text-align:center;font-size:12px;font-weight:bold;color:${C.greenDark};line-height:24px">${i + 1}</div></td><td style="padding-left:10px;font-size:14px;line-height:22px;color:${C.muted}">${esc(s)}</td></tr></table>`,
        )
        .join("")}
    </td></tr>

    <!-- segurança -->
    <tr><td style="background:${C.white};padding:14px 28px 28px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line}">
        <tr><td style="padding-top:18px;font-family:Arial,Helvetica,sans-serif">
          <p style="margin:0;font-size:13px;font-weight:bold;color:${C.ink}">${esc(L.safeTitle)}</p>
          <p style="margin:4px 0 0;font-size:13px;line-height:20px;color:${C.muted}">${esc(L.safe)}</p>
        </td></tr>
      </table>
    </td></tr>

    <!-- rodapé -->
    <tr><td style="background:${C.white};border-radius:0 0 20px 20px;border-top:1px solid ${C.line};padding:18px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${C.muted}">
      ${esc(L.help)} <a href="mailto:${esc(e.supportEmail)}" style="color:${C.greenDark};text-decoration:underline">${esc(e.supportEmail)}</a>.
    </td></tr>
    <tr><td align="center" style="padding:16px 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;color:${C.muted}">
      Carretel · ${esc(L.tagline)}${e.cnpj ? ` · CNPJ ${esc(e.cnpj)}` : ""}
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
}

export function codeEmailText(e: CodeEmail): string {
  const pt = e.locale === "pt-BR";
  return pt
    ? `${e.subject}\n\nSeu código: ${e.code}\nVale por ${e.minutes} minutos e só pode ser usado uma vez.\n\nCriar a senha nova: ${e.actionUrl}\n\nNão foi você? Ignore este e-mail: sua senha continua a mesma.\nDúvidas: ${e.supportEmail}`
    : `${e.subject}\n\nSu código: ${e.code}\nVale ${e.minutes} minutos y se usa una sola vez.\n\nCrear la contraseña nueva: ${e.actionUrl}\n\n¿No fue usted? Ignore este correo: su contraseña sigue igual.\nDudas: ${e.supportEmail}`;
}
