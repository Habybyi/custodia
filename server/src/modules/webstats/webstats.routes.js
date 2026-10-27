import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireRole } from "../../middleware/auth.js";
import * as webStatsService from "./webstats.service.js";

export const publicEventsRouter = Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Priveľa udalostí." },
});

publicEventsRouter.post("/", limiter, async (req, res) => {
  await webStatsService.recordEvent(req.body, req.get("User-Agent"));
  res.status(204).end();
});

publicEventsRouter.get("/summary", async (req, res) => {
  res.set("Cache-Control", "public, max-age=60");
  res.json(await webStatsService.getPublicSummary());
});

export const statsRouter = Router();
statsRouter.use(requireRole("OWNER"));

statsRouter.get("/web", async (req, res) => {
  res.json(await webStatsService.getWebStats(req.query));
});
