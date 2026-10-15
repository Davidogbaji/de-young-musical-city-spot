import nodemailer from "nodemailer";
import { env } from "../config/env";

let transport: nodemailer.Transporter | null = null;
function getTransport() {
  if (!env.SMTP_HOST) return null;
  transport ??= nodemailer.createTransport({
    host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transport;
}

export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const t = getTransport();
  if (!t) {
    // Development: print the email so you can click the reset link. Production: never log link contents.
    if (env.NODE_ENV !== "production") console.log(`\n[Email not sent: SMTP not configured]\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`);
    else console.warn("SMTP is not configured, so an email was not sent.");
    return false;
  }
  await t.sendMail({ from: env.MAIL_FROM || env.SMTP_USER, to, subject, text });
  return true;
}
