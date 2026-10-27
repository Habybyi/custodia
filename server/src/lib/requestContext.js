import { AsyncLocalStorage } from "node:async_hooks";

const storage = new AsyncLocalStorage();

const cleanIp = (ip) => (ip ? String(ip).replace(/^::ffff:/, "") : null);

export function vercelClientIp(req, res, next) {
  const ip = req.get("x-vercel-forwarded-for")?.split(",")[0].trim();
  if (ip) Object.defineProperty(req, "ip", { value: ip, configurable: true });
  next();
}

export function requestContext(req, res, next) {
  storage.run({ ip: cleanIp(req.ip), userAgent: req.get("user-agent")?.slice(0, 300) || null }, next);
}

export const currentRequest = () => storage.getStore() || {};
