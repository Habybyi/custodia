import nodemailer from "nodemailer";
import { config } from "../../config.js";

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  ...(config.smtp.user ? { auth: { user: config.smtp.user, pass: config.smtp.pass } } : {}),
});

const parseFrom = (from) => {
  const match = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(from);
  return match ? { name: match[1] || "Custodia", email: match[2] } : { name: "Custodia", email: from.trim() };
};

async function sendViaBrevo({ to, subject, text, html }) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "api-key": config.brevoApiKey },
    body: JSON.stringify({ sender: parseFrom(config.mailFrom), to: [{ email: to }], subject, textContent: text, htmlContent: html }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(`Brevo ${response.status}: ${detail.message || "e-mail sa nepodarilo odoslať"}`);
  }
  return response.json();
}

export const sendEmail = ({ to, subject, text, html }) =>
  config.brevoApiKey
    ? sendViaBrevo({ to, subject, text, html })
    : transporter.sendMail({ from: config.mailFrom, to, subject, text, html });
