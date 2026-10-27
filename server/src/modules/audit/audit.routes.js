import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import * as auditService from "./audit.service.js";

export const auditRouter = Router();
auditRouter.use(requireRole("OWNER"));

auditRouter.get("/", async (req, res) => {
  res.json(await auditService.listAudit(req.query));
});

auditRouter.get("/users", async (req, res) => {
  res.json(await auditService.listAuditUsers());
});

auditRouter.get("/ip/:ip", async (req, res) => {
  res.json(await auditService.ipSummary(String(req.params.ip).slice(0, 64)));
});

auditRouter.get("/whoami", async (req, res) => {
  const pick = ["x-forwarded-for", "x-real-ip", "x-vercel-forwarded-for", "x-vercel-ip", "cf-connecting-ip", "true-client-ip", "x-client-ip", "forwarded"];
  res.json({ ip: req.ip, ips: req.ips, headers: Object.fromEntries(pick.map((k) => [k, req.get(k) ?? null])) });
});
