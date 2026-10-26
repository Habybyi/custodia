import { test } from "node:test";
import assert from "node:assert/strict";
import { TEMPLATES, renderTemplate } from "../src/modules/notifications/templates.js";

const payload = {
  number: 42,
  firstName: "Ján",
  typeLabel: "zazimovanie",
  description: "Tečie voda",
  dayLabel: "pondelok 19. 10. 2026",
  timeLabel: "08:00",
  address: "Levočská 14, Poprad",
  customerName: "Ján Hudák",
  priorityLabel: "normálna",
  sourceLabel: "telefonát",
  requestId: "abc",
  reason: "prší",
  type: "WINTERIZATION",
  name: "Peter",
  items: [{ time: "08:00", customer: "Ján Hudák", address: "Levočská 14, Poprad", typeLabel: "zazimovanie", phone: "0905" }],
  materialName: "Batéria 9 V",
  stockQty: 2,
  minStock: 4,
  unit: "ks",
  url: "https://custodia.sk/reset-password?token=abc",
  minutes: 60,
};

test("každá šablóna má predmet, text aj HTML bez 'undefined'", () => {
  for (const name of Object.keys(TEMPLATES)) {
    const message = renderTemplate(name, payload);
    for (const part of ["subject", "text", "html"]) {
      assert.ok(message[part], `${name}.${part} chýba`);
      assert.ok(!message[part].includes("undefined"), `${name}.${part} obsahuje undefined`);
    }
  }
});

test("HTML v e-maile je bezpečné voči vloženému kódu", () => {
  const message = renderTemplate("REQUEST_RECEIVED", { ...payload, description: "<script>alert(1)</script>" });
  assert.ok(!message.html.includes("<script>"));
  assert.ok(message.html.includes("&lt;script&gt;"));
});

test("neznáma šablóna vyhodí chybu", () => {
  assert.throws(() => renderTemplate("NEEXISTUJE", {}));
});
