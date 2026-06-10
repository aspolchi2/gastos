import nodemailer from "nodemailer";

const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_APP_PASSWORD;

// Transporte Gmail vía SMTP usando una "app password" (no la clave normal de la
// cuenta). Se crea de forma perezosa para no romper el build si faltan las vars.
function getTransport() {
  if (!user || !pass) {
    throw new Error(
      "GMAIL_USER y GMAIL_APP_PASSWORD deben estar definidas para enviar mails",
    );
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export type Attachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export async function sendMail(opts: {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: Attachment[];
}) {
  const transport = getTransport();
  await transport.sendMail({
    from: `Gastos <${user}>`,
    to: opts.to.join(", "),
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    attachments: opts.attachments,
  });
}
