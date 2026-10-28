const PHONE_HINT = "Skúste to znova alebo nám zavolajte na +421 900 123 456.";

async function postCRM(path, data) {
  let r;
  try {
    r = await fetch(CFG.crm + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (e) {
    throw new Error("Nepodarilo sa spojiť so serverom. " + PHONE_HINT);
  }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    const field = d.fields && Object.values(d.fields)[0];
    throw new Error(field || d.error || "Odoslanie zlyhalo. " + PHONE_HINT);
  }
  return d;
}

const okMail = (v) => /^\S+@\S+\.\S+$/.test(v),
  okTel = (v) => v.replace(/[^\d]/g, "").length >= 9;

async function submitting(form, fn) {
  const btn = form.querySelector("[type=submit]");
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Odosielam…";
  try {
    return await fn();
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
}

$("#lead").onsubmit = async (e) => {
  e.preventDefault();
  const n = $("#ln").value.trim(),
    t = $("#lp").value,
    m = $("#le").value.trim(),
    er = $("#lerr");
  er.textContent = "";
  if (!n || !okTel(t) || !okMail(m)) {
    er.textContent = "Vyplňte meno, platný telefón a e-mail.";
    return;
  }
  if (!$("#lc").checked) {
    er.textContent = "Potrebujeme váš súhlas so spracovaním údajov.";
    return;
  }
  try {
    const d = await submitting(e.target, () =>
      postCRM("/requests", {
        source: "CALCULATOR",
        name: n,
        phone: t,
        email: m,
        description: `Dopyt z kalkulačky: počet zón ${calc.zones}, pozemok ${calc.area} m², orientačne ${calc.priceFrom} až ${calc.priceTo} €.`,
        payload: { ...calc, utm: src.utm, referrer: src.referrer },
        gdprConsent: true,
        website: $("#lw").value,
      }),
    );
    track("lead_submit", { from: "calculator" });
    e.target.innerHTML = `<div class="ok">Ďakujeme! Dopyt č. ${esc(d.number ?? "")} aj s výsledkom kalkulácie sme prijali. Potvrdenie sme vám poslali e-mailom, ozveme sa do 24 hodín a dohodneme obhliadku.</div>`;
    $("#nv").classList.add("hide");
  } catch (err) {
    er.textContent = err.message;
  }
};

const SERVICE_TYPES = { porucha: "FAULT", spustenie: "SPRING_START", zazimovanie: "WINTERIZATION" };
let daysLoaded = false;
const cal = { free: new Map(), month: null, first: null, last: null };
const WEEKDAYS = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];
const pad = (n) => String(n).padStart(2, "0");
const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const dayLabel = (key) =>
  new Date(key + "T12:00:00").toLocaleDateString("sk-SK", { weekday: "long", day: "numeric", month: "long" });

function renderCalendar() {
  const box = $("#cal"),
    picked = $("#sd").value;
  const { y, m } = cal.month;
  const title = new Date(y, m, 1).toLocaleDateString("sk-SK", { month: "long", year: "numeric" });
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const count = new Date(y, m + 1, 0).getDate();
  const canPrev = keyOf(y, m, 1) > cal.first;
  const canNext = keyOf(y, m, count) < cal.last;
  let cells = "";
  for (let i = 0; i < offset; i++) cells += "<span></span>";
  for (let d = 1; d <= count; d++) {
    const key = keyOf(y, m, d),
      free = cal.free.get(key);
    cells += free
      ? `<button type="button" class="cal-d${key === picked ? " on" : ""}" data-day="${key}" aria-pressed="${key === picked}" aria-label="${esc(dayLabel(key))}, voľné miesta: ${free}">${d}<small>${free} voľ.</small></button>`
      : `<span class="cal-d off" aria-hidden="true">${d}</span>`;
  }
  box.innerHTML = `
    <div class="cal-h">
      <button type="button" class="cal-n" data-step="-1" aria-label="Predchádzajúci mesiac" ${canPrev ? "" : "disabled"}>‹</button>
      <b>${esc(title)}</b>
      <button type="button" class="cal-n" data-step="1" aria-label="Ďalší mesiac" ${canNext ? "" : "disabled"}>›</button>
    </div>
    <div class="cal-g">${WEEKDAYS.map((w) => `<span class="cal-w">${w}</span>`).join("")}${cells}</div>
    <p class="cal-s">${picked ? `Vybraný termín: <b>${esc(dayLabel(picked))}</b>` : "Kliknite na zelený deň. Sivé dni sú plné."}</p>`;
}

$("#cal").onclick = (e) => {
  const day = e.target.closest("[data-day]"),
    nav = e.target.closest("[data-step]");
  if (day) {
    $("#sd").value = day.dataset.day;
    renderCalendar();
  } else if (nav && !nav.disabled) {
    const next = new Date(cal.month.y, cal.month.m + Number(nav.dataset.step), 1);
    cal.month = { y: next.getFullYear(), m: next.getMonth() };
    renderCalendar();
  }
};

async function loadFreeDays() {
  if (daysLoaded) return;
  const box = $("#cal");
  try {
    const r = await fetch(CFG.crm + "/availability?days=60");
    const { days } = await r.json();
    if (!days.length) {
      box.innerHTML = '<p class="who">Najbližšie dni sú plné, zavolajte nám.</p>';
      return;
    }
    days.forEach((d) => cal.free.set(d.date, d.free));
    cal.first = days[0].date;
    cal.last = days[days.length - 1].date;
    const [y, m] = cal.first.split("-").map(Number);
    cal.month = { y, m: m - 1 };
    daysLoaded = true;
    renderCalendar();
  } catch (e) {
    box.innerHTML = '<p class="who">Termíny sa nepodarilo načítať, zavolajte nám.</p>';
  }
}

$("#st").onchange = () => {
  const p = $("#st").value === "porucha";
  $("#dt").classList.toggle("hide", p);
  $("#dt-hint").classList.toggle("hide", p);
  $("#ur").classList.toggle("hide", !p);
  if (!p) loadFreeDays();
};

$("#sf").onsubmit = async (e) => {
  e.preventDefault();
  const g = (i) => $("#" + i).value.trim(),
    er = $("#serr"),
    kind = g("st"),
    isFault = kind === "porucha";
  er.textContent = "";
  if (!g("sn") || !okTel(g("sp")) || !okMail(g("se")) || !g("sa") || !g("sm")) {
    er.textContent = "Vyplňte meno, telefón, e-mail, ulicu a obec záhrady.";
    return;
  }
  if (!isFault && !g("sd")) {
    er.textContent = "Vyberte voľný termín.";
    return;
  }
  if (isFault && !g("sx")) {
    er.textContent = "Stručne popíšte poruchu.";
    return;
  }
  if (!$("#sc").checked) {
    er.textContent = "Potrebujeme váš súhlas so spracovaním údajov.";
    return;
  }
  const common = {
    name: g("sn"),
    phone: g("sp"),
    email: g("se"),
    street: g("sa"),
    city: g("sm"),
    description: g("sx") || undefined,
    gdprConsent: true,
    website: $("#sw").value,
  };
  try {
    const d = await submitting(e.target, () =>
      isFault
        ? postCRM("/requests", { ...common, source: "WEB_FORM", type: "FAULT", urgent: $("#su").checked })
        : postCRM("/bookings", { ...common, type: SERVICE_TYPES[kind], date: g("sd") }),
    );
    track("service_submit", { type: kind });
    const when = isFault
      ? "Ozveme sa vám čo najskôr."
      : `Rezervovali sme vám ${new Date(d.date + "T12:00:00").toLocaleDateString("sk-SK", { weekday: "long", day: "numeric", month: "numeric" })}, presný čas potvrdíme e-mailom.`;
    e.target.innerHTML = `<div class="ok">Požiadavku č. ${esc(d.number ?? "")} sme prijali. ${when} Ďakujeme!</div>`;
  } catch (err) {
    er.textContent = err.message;
    if (!isFault) {
      daysLoaded = false;
      loadFreeDays();
    }
  }
};
