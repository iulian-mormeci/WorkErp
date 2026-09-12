import nodemailer from "nodemailer";

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

// Se l'SMTP non è configurato, logga soltanto e non lancia — l'integrazione
// email è pensata per funzionare non appena l'utente compila le variabili
// d'ambiente, senza dover toccare codice, ma finché non lo fa non deve mai
// far fallire l'azione che ha innescato l'invio.
export async function sendEmail(to: string, subject: string, text: string) {
  const transport = getTransport();
  if (!transport) {
    console.log(`[email] SMTP non configurato — email non inviata: "${subject}" a ${to}`);
    return;
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  });
}
