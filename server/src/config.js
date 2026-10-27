import "dotenv/config";

process.env.TZ = process.env.APP_TIMEZONE || "Europe/Bratislava";

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Chýba premenná prostredia ${name} (pozri server/.env.example).`);
  }
  return value;
};

export const config = {
  port: Number(process.env.PORT || 3001),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  websiteOrigins: (process.env.WEBSITE_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean),
  appUrl: process.env.APP_URL || process.env.CLIENT_ORIGIN || "http://localhost:5173",
  smtp: {
    host: process.env.SMTP_HOST || "localhost",
    port: Number(process.env.SMTP_PORT || 1025),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
  mailFrom: process.env.MAIL_FROM || "Custodia <servis@custodia.sk>",
  brevoApiKey: process.env.BREVO_API_KEY || "",
  inboundEmailSecret: process.env.INBOUND_EMAIL_SECRET || "",
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  },
  notificationsWorker: process.env.NOTIFICATIONS_WORKER !== "false",
};
