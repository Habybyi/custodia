import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { getPagination, paginated } from "../../lib/pagination.js";
import { currentRequest } from "../../lib/requestContext.js";
import { dayStart, dayEnd, isDay } from "../../lib/dates.js";
import { parse } from "../../lib/validate.js";

export const ACTION_GROUPS = {
  security: ["LOGIN", "LOGIN_FAILED", "PASSWORD_CHANGED", "PASSWORD_RESET", "PASSWORD_RESET_REQUESTED", "PASSWORD_RESET_BY_EMAIL", "USER_CREATED", "USER_UPDATED"],
  failed: ["LOGIN_FAILED"],
  logins: ["LOGIN"],
  customers: ["CUSTOMER_CREATED", "CUSTOMER_UPDATED", "CUSTOMER_DELETED", "CUSTOMER_EXPORTED"],
};

export async function logAudit({ userId, action, entityType, entityId, details }) {
  const { ip = null, userAgent = null } = currentRequest();
  try {
    await prisma.auditLog.create({
      data: { userId, action, entityType, entityId: entityId ? String(entityId) : null, details, ip, userAgent },
    });
  } catch (err) {
    console.error("Audit log zlyhal:", err);
  }
}

const day = z.preprocess((v) => (v === "" ? undefined : v), z.string().refine(isDay).optional());
const text = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(100).optional());

const filterSchema = z.object({
  userId: z.preprocess((v) => (v === "" ? undefined : v), z.uuid().optional()),
  action: text,
  group: z.preprocess((v) => (v === "" ? undefined : v), z.enum(Object.keys(ACTION_GROUPS)).optional()),
  ip: text,
  q: text,
  from: day,
  to: day,
});

export async function listAudit(query) {
  const pagination = getPagination(query);
  const f = parse(filterSchema, query);
  const and = [];
  if (f.userId) and.push({ userId: f.userId });
  if (f.action) and.push({ action: f.action });
  if (f.group) and.push({ action: { in: ACTION_GROUPS[f.group] } });
  if (f.ip) and.push({ ip: { contains: f.ip } });
  if (f.from) and.push({ createdAt: { gte: dayStart(f.from) } });
  if (f.to) and.push({ createdAt: { lt: dayEnd(f.to) } });
  if (f.q) {
    and.push({
      OR: [
        { user: { name: { contains: f.q, mode: "insensitive" } } },
        { user: { email: { contains: f.q, mode: "insensitive" } } },
        { details: { path: ["email"], string_contains: f.q } },
        { ip: { contains: f.q } },
      ],
    });
  }
  const where = and.length ? { AND: and } : {};
  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return paginated(items, total, pagination);
}

export async function listAuditUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export async function ipSummary(ip) {
  const where = { ip };
  const [first, last, users, failed] = await prisma.$transaction([
    prisma.auditLog.findFirst({ where, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    prisma.auditLog.findFirst({ where, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.auditLog.findMany({ where: { ip, userId: { not: null } }, distinct: ["userId"], select: { user: { select: { name: true, email: true } } } }),
    prisma.auditLog.count({ where: { ip, action: "LOGIN_FAILED" } }),
  ]);
  return { ip, firstSeen: first?.createdAt ?? null, lastSeen: last?.createdAt ?? null, users: users.map((u) => u.user).filter(Boolean), failedLogins: failed };
}
