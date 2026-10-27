import { AsyncLocalStorage } from "node:async_hooks";

const storage = new AsyncLocalStorage();

const cleanIp = (ip) => (ip ? String(ip).replace(/^::ffff:/, "") : null);

export function requestContext(req, res, next) {
  storage.run({ ip: cleanIp(req.ip), userAgent: req.get("user-agent")?.slice(0, 300) || null }, next);
}

export const currentRequest = () => storage.getStore() || {};
