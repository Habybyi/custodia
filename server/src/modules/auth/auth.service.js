import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../../config.js";
import { prisma } from "../../lib/prisma.js";
import { badRequest, unauthorized } from "../../lib/httpError.js";
import { parse } from "../../lib/validate.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { logAudit } from "../audit/audit.service.js";
import { sendEmail } from "../notifications/mailer.js";
import { renderTemplate } from "../notifications/templates.js";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Zadaj platný e-mail."),
  password: z.string().min(1, "Zadaj heslo."),
});

export const passwordSchema = z
  .string()
  .min(8, "Heslo musí mať aspoň 8 znakov.")
  .regex(/[A-Za-z]/, "Heslo musí obsahovať písmeno.")
  .regex(/[0-9]/, "Heslo musí obsahovať číslo.");

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: passwordSchema,
});

export const toPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  mustChangePassword: user.mustChangePassword,
  customerId: user.customerId,
});

export async function login(body) {
  const { email, password } = parse(loginSchema, body);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) {
    await logAudit({
      userId: user?.id ?? null,
      action: "LOGIN_FAILED",
      entityType: "User",
      entityId: user?.id,
      details: { email, reason: !user ? "neznámy e-mail" : !user.isActive ? "deaktivovaný účet" : "zlé heslo" },
    });
    throw unauthorized("Nesprávny e-mail alebo heslo.");
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
  await logAudit({ userId: user.id, action: "LOGIN", entityType: "User", entityId: user.id });
  return { token, user: toPublicUser(user) };
}

export async function changePassword(userId, body) {
  const { currentPassword, newPassword } = parse(changePasswordSchema, body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (!user.mustChangePassword) {
    if (!currentPassword) {
      throw badRequest("Zadaj aktuálne heslo.", { fields: { currentPassword: "Zadaj aktuálne heslo." } });
    }
    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      throw badRequest("Aktuálne heslo nesedí.", { fields: { currentPassword: "Aktuálne heslo nesedí." } });
    }
  }
  if (await verifyPassword(newPassword, user.passwordHash)) {
    throw badRequest("Nové heslo musí byť iné ako to súčasné.", {
      fields: { newPassword: "Nové heslo musí byť iné ako to súčasné." },
    });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword), mustChangePassword: false },
  });
  await logAudit({ userId, action: "PASSWORD_CHANGED", entityType: "User", entityId: userId });
  return toPublicUser(updated);
}

const RESET_MINUTES = 60;
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email("Zadaj platný e-mail."),
});

const resetSchema = z.object({
  token: z.string().min(20, "Odkaz na obnovu hesla je neplatný."),
  newPassword: passwordSchema,
});

export async function requestPasswordReset(body) {
  const { email } = parse(forgotSchema, body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return;

  await prisma.passwordReset.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.passwordReset.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_MINUTES * 60 * 1000) },
  });

  const url = `${config.appUrl}/reset-password?token=${token}`;
  const mail = renderTemplate("PASSWORD_RESET", { name: user.name.split(" ")[0], url, minutes: RESET_MINUTES });
  sendEmail({ to: user.email, ...mail }).catch((err) => console.error("Obnova hesla: e-mail sa nepodarilo odoslať", err.message));
  await logAudit({ userId: user.id, action: "PASSWORD_RESET_REQUESTED", entityType: "User", entityId: user.id });
}

export async function resetPassword(body) {
  const { token, newPassword } = parse(resetSchema, body);
  const reset = await prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date() || !reset.user.isActive) {
    throw badRequest("Odkaz na obnovu hesla je neplatný alebo vypršal. Požiadaj o nový.");
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: await hashPassword(newPassword), mustChangePassword: false } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
  ]);
  await logAudit({ userId: reset.userId, action: "PASSWORD_RESET_BY_EMAIL", entityType: "User", entityId: reset.userId });
}

