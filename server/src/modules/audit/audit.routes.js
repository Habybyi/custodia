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

