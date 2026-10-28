import { prisma } from "../../lib/prisma.js";
import { deviceSelect } from "../iot/iot.rules.js";
import { notFound } from "../../lib/httpError.js";
import { logAudit } from "../audit/audit.service.js";


export async function exportCustomer(actorId, id) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      gardens: { include: { zones: true, photos: { select: { id: true, caption: true, createdAt: true } }, devices: { select: deviceSelect } } },
      serviceRequests: {
        include: { statusChanges: true, appointments: true, workLogs: { include: { materials: { include: { material: true } } } } },
      },
      notifications: { select: { template: true, recipient: true, status: true, sentAt: true, createdAt: true } },
      user: { select: { email: true, name: true, createdAt: true } },
    },
  });
  if (!customer) throw notFound("Zákazník sa nenašiel.");
  await logAudit({ userId: actorId, action: "CUSTOMER_EXPORTED", entityType: "Customer", entityId: id });
  return {
    exportedAt: new Date().toISOString(),
    note: "Export osobných údajov podľa čl. 15 a 20 GDPR. Custodia, Ul. 29. augusta 4812, 058 01 Poprad.",
    customer,
  };
}
