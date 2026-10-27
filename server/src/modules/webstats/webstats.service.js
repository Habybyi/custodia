import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { parse } from "../../lib/validate.js";
import { addDays, dayKey, dayStart } from "../../lib/dates.js";
import { WEB_EVENT_TYPES, isBot, normalizeSource } from "./webstats.rules.js";

const eventSchema = z.object({
  type: z.enum(WEB_EVENT_TYPES),
  source: z.string().max(200).optional(),
});

const rangeSchema = z.object({
  days: z.coerce.number().int().refine((d) => [7, 30, 90].includes(d)).default(30),
});

export async function recordEvent(body, userAgent) {
  if (isBot(userAgent)) return;
  const result = eventSchema.safeParse(body);
  if (!result.success) return;
  await prisma.webEvent.create({ data: { type: result.data.type, source: normalizeSource(result.data.source) } });
}

export async function getWebStats(query) {
  const { days } = parse(rangeSchema, query);
  const since = dayStart(addDays(dayKey(new Date()), -(days - 1)));
  const [byType, bySource, daily, requestsBySource, leads] = await Promise.all([
    prisma.webEvent.groupBy({ by: ["type"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.webEvent.groupBy({
      by: ["source"],
      where: { createdAt: { gte: since }, type: "page_view" },
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
      take: 8,
    }),
    prisma.$queryRaw`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Bratislava', 'YYYY-MM-DD') AS day, count(*)::int AS count
      FROM "WebEvent"
      WHERE type = 'page_view' AND "createdAt" >= ${since}
      GROUP BY day ORDER BY day`,
    prisma.serviceRequest.groupBy({ by: ["source"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.customer.groupBy({
      by: ["status"],
      where: { deletedAt: null, source: { in: ["WEB_FORM", "CALCULATOR"] }, createdAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);

  const counts = Object.fromEntries(WEB_EVENT_TYPES.map((t) => [t, 0]));
  for (const row of byType) counts[row.type] = row._count._all;
  const leadCounts = Object.fromEntries(leads.map((r) => [r.status, r._count._all]));

  return {
    days,
    counts,
    sources: bySource.map((r) => ({ source: r.source, count: r._count._all })),
    daily,
    requestsBySource: requestsBySource.map((r) => ({ source: r.source, count: r._count._all })).sort((a, b) => b.count - a.count),
    webCustomers: { leads: leadCounts.LEAD || 0, active: leadCounts.ACTIVE || 0 },
  };
}

let summaryCache = { at: 0, data: null };

export async function getPublicSummary() {
  if (summaryCache.data && Date.now() - summaryCache.at < 60_000) return summaryCache.data;
  const stats = await getWebStats({ days: 30 });
  const data = { days: stats.days, counts: stats.counts, sources: stats.sources.slice(0, 5) };
  summaryCache = { at: Date.now(), data };
  return data;
}
