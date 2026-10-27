import crypto from "node:crypto";
import { z } from "zod";
import { config } from "../../config.js";
import { prisma } from "../../lib/prisma.js";
import { badRequest, unauthorized } from "../../lib/httpError.js";
import { parse } from "../../lib/validate.js";
import { normalizePhone } from "../../lib/phone.js";
import { optionalEmail, optionalText, requiredText } from "../../lib/fields.js";
import { createRequestRecord, REQUEST_TYPES } from "../requests/requests.service.js";
import { addMinutes, atTime, formatDaySk, isDay } from "../../lib/dates.js";
import { enqueueNotification } from "../notifications/notifications.service.js";
import { REQUEST_TYPE_LABELS } from "../notifications/labels.js";
import { getPublicAvailability } from "../schedule/capacity.service.js";
import { getScheduleSettings } from "../schedule/settings.service.js";
import { RESERVATION_NOTE } from "../schedule/appointments.service.js";


const splitName = (fullName) => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.at(-1) };
};

async function findOrCreateCustomer({ name, email, phone, street, city, postalCode, source, marketingConsent = false }) {
  const phoneNormalized = normalizePhone(phone);
  const byEmail = email
    ? await prisma.customer.findFirst({
        where: { deletedAt: null, email: { equals: email, mode: "insensitive" } },
        orderBy: { createdAt: "asc" },
      })
    : null;
  let customer =
    byEmail ||
    (phoneNormalized
      ? await prisma.customer.findFirst({ where: { deletedAt: null, phoneNormalized }, orderBy: { createdAt: "asc" } })
      : null);

  if (!customer) {
    const { firstName, lastName } = splitName(name || email || "Neznámy");
    customer = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        phoneNormalized,
        status: "LEAD",
        source,
        marketingConsent,
        preferredContact: phone ? "PHONE" : "EMAIL",
      },
    });
  } else if (!customer.email && email) {
    customer = await prisma.customer.update({ where: { id: customer.id }, data: { email } });
  }

  let gardenId = null;
  if (street && city) {
    const existing = await prisma.garden.findFirst({
      where: {
        customerId: customer.id,
        deletedAt: null,
        street: { equals: street, mode: "insensitive" },
        city: { equals: city, mode: "insensitive" },
      },
    });
    gardenId = existing
      ? existing.id
      : (await prisma.garden.create({ data: { customerId: customer.id, street, city, postalCode: postalCode || null } })).id;
  } else {
    const gardens = await prisma.garden.findMany({ where: { customerId: customer.id, deletedAt: null }, select: { id: true } });
    if (gardens.length === 1) gardenId = gardens[0].id;
  }

  return { customer, gardenId };
}

const publicSchema = z
  .object({
    source: z.enum(["WEB_FORM", "CALCULATOR"]).default("WEB_FORM"),
    type: z.enum(REQUEST_TYPES).optional(),
    name: requiredText("Zadaj meno.", 150),
    email: optionalEmail,
    phone: optionalText(40),
    street: optionalText(200),
    city: optionalText(100),
    postalCode: optionalText(20),
    description: optionalText(3000),
    urgent: z.boolean().default(false),
    payload: z.record(z.string(), z.unknown()).optional(),
    gdprConsent: z.literal(true, { message: "Potrebujeme súhlas so spracovaním údajov." }),
    marketingConsent: z.boolean().default(false),
    website: z.string().max(0).optional().or(z.literal("")),
  })
  .refine((d) => d.email || d.phone, { message: "Zadaj telefón alebo e-mail.", path: ["phone"] });

export async function submitPublicRequest(body) {
  if (body && typeof body.website === "string" && body.website.length > 0) {
    return { number: null };
  }
  const data = parse(publicSchema, body);
  if (data.payload && JSON.stringify(data.payload).length > 10_000) {
    throw badRequest("Príliš veľa údajov z kalkulačky.");
  }

  const type = data.type || (data.source === "CALCULATOR" ? "INSPECTION" : "OTHER");
  const { customer, gardenId } = await findOrCreateCustomer({ ...data });
  const request = await createRequestRecord({
    customer,
    gardenId,
    type,
    priority: data.urgent ? "EMERGENCY" : "NORMAL",
    source: data.source,
    title: data.source === "CALCULATOR" ? "Dopyt z kalkulačky: presná ponuka a obhliadka" : null,
    description: data.description,
    payload: data.payload,
    notifyCustomer: true,
    notifyStaff: true,
  });
  return { number: request.number };
}

const inboundSchema = z.object({
  from: requiredText("Chýba odosielateľ.", 300),
  subject: optionalText(300),
  text: optionalText(20_000),
});

const parseFrom = (from) => {
  const match = from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  const email = (match ? match[2] : from).trim().toLowerCase();
  const name = match?.[1]?.trim() || null;
  return { name, email };
};

export const guessType = (text) => {
  const t = text.toLowerCase();
  if (/(porucha|nefunguj|nejde|te[cč]ie|kvapk|pokazen|prasknut|havari)/.test(t)) return "FAULT";
  if (/zazimov/.test(t)) return "WINTERIZATION";
  if (/(spusten|spusti|jar)/.test(t)) return "SPRING_START";
  if (/(kosen|kosi|vertikut|hnoj|tr[aá]vnik)/.test(t)) return "LAWN_CARE";
  if (/(in[sš]tal|nov[yý] syst|ponuk|cen)/.test(t)) return "INSTALLATION";
  return "OTHER";
};

export const isUrgent = (text) => /(havari|te[cč]ie|zaplav|urgent|s[uú]rne)/i.test(text);

export function verifyInboundSecret(provided) {
  const expected = config.inboundEmailSecret;
  if (!expected || !provided) throw unauthorized("Chýba alebo nesedí kľúč pre príjem e-mailov.");
  const a = Buffer.from(String(provided));
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw unauthorized("Chýba alebo nesedí kľúč pre príjem e-mailov.");
  }
}

export async function receiveInboundEmail(body) {
  const data = parse(inboundSchema, body);
  const { name, email } = parseFrom(data.from);
  if (!z.email().safeParse(email).success) throw badRequest("Neplatný e-mail odosielateľa.");

  const content = `${data.subject || ""}\n${data.text || ""}`;
  const { customer, gardenId } = await findOrCreateCustomer({ name, email, source: "EMAIL" });
  const request = await createRequestRecord({
    customer,
    gardenId,
    type: guessType(content),
    priority: isUrgent(content) ? "HIGH" : "NORMAL",
    source: "EMAIL",
    title: data.subject || null,
    description: data.text?.slice(0, 5000) || null,
    notifyCustomer: true,
    notifyStaff: true,
  });
  return { number: request.number };
}

const bookingSchema = z
  .object({
    type: z.enum(["SPRING_START", "WINTERIZATION", "LAWN_CARE", "INSPECTION"], { message: "Vyber službu." }),
    date: z.string().refine(isDay, "Vyber deň."),
    name: requiredText("Zadaj meno.", 150),
    email: optionalEmail,
    phone: optionalText(40),
    street: requiredText("Zadaj ulicu záhrady.", 200),
    city: requiredText("Zadaj obec.", 100),
    postalCode: optionalText(20),
    description: optionalText(3000),
    gdprConsent: z.literal(true, { message: "Potrebujeme súhlas so spracovaním údajov." }),
    marketingConsent: z.boolean().default(false),
    website: z.string().max(0).optional().or(z.literal("")),
  })
  .refine((d) => d.email || d.phone, { message: "Zadaj telefón alebo e-mail.", path: ["phone"] });

export async function submitPublicBooking(body) {
  if (body && typeof body.website === "string" && body.website.length > 0) return { number: null };
  const data = parse(bookingSchema, body);

  const available = await getPublicAvailability(60);
  if (!available.some((d) => d.date === data.date)) {
    throw badRequest("Tento deň je už obsadený. Vyber iný.", { fields: { date: "Deň je obsadený." } });
  }

  const settings = await getScheduleSettings();
  const { customer, gardenId } = await findOrCreateCustomer({ ...data, source: "WEB_FORM" });
  const request = await createRequestRecord({
    customer,
    gardenId,
    type: data.type,
    source: "WEB_FORM",
    description: data.description,
    payload: { preferredDate: data.date },
    notifyCustomer: false,
    notifyStaff: true,
  });

  const startsAt = atTime(data.date, settings.workdayStart);
  await prisma.appointment.create({
    data: {
      serviceRequestId: request.id,
      gardenId,
      startsAt,
      endsAt: addMinutes(startsAt, settings.durations[data.type]),
      status: "RESERVED",
      notes: RESERVATION_NOTE,
    },
  });

  if (customer.email) {
    await enqueueNotification({
      template: "BOOKING_RECEIVED",
      recipient: customer.email,
      customerId: customer.id,
      payload: {
        requestId: request.id,
        number: request.number,
        firstName: customer.firstName,
        typeLabel: REQUEST_TYPE_LABELS[data.type],
        dayLabel: formatDaySk(startsAt),
        address: `${data.street}, ${data.city}`,
      },
    });
  }
  return { number: request.number, date: data.date };
}
