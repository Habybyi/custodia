const CONSENT_KEY = "consent_v2";
let consent = st.get(CONSENT_KEY);
const can = (cat) => !!(consent && consent[cat]);

function saveConsent(analytics, external) {
  consent = { analytics, external, ts: new Date().toISOString() };
  st.set(CONSENT_KEY, consent);
  $("#ck").classList.add("hide");
  applyConsent();
}

function openCookies(settings) {
  $("#ck").classList.remove("hide");
  $("#ck-main").classList.toggle("hide", !!settings);
  $("#ck-set").classList.toggle("hide", !settings);
  $("#c-an").checked = can("analytics");
  $("#c-ex").checked = can("external");
}

$("#ck-all").onclick = () => saveConsent(true, true);
$("#ck-min").onclick = () => saveConsent(false, false);
$("#ck-open").onclick = () => openCookies(true);
$("#ck-save").onclick = () => saveConsent($("#c-an").checked, $("#c-ex").checked);
$$("[data-cookies]").forEach(
  (a) =>
    (a.onclick = (e) => {
      e.preventDefault();
      openCookies(true);
    }),
);

const q = new URLSearchParams(location.search);
let ref = "priamo";
try {
  if (document.referrer) {
    const h = new URL(document.referrer).hostname;
    ref = h === location.hostname ? "priamo" : h.replace(/^www\./, "");
  }
} catch (e) {}
const src = { utm: q.get("utm_source") || null, referrer: ref };
const srcLabel = src.utm || ref;

let gaLoaded = false;
function loadGA() {
  if (gaLoaded || !CFG.ga4) return;
  gaLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    dataLayer.push(arguments);
  };
  gtag("js", new Date());
  gtag("config", CFG.ga4, { anonymize_ip: true });
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CFG.ga4);
  document.head.appendChild(s);
}

const CRM_EVENTS = ["page_view", "calc_start", "calc_complete", "lead_submit", "service_submit", "chat_message"];
function crmEvent(ev) {
  if (!CFG.crm || !CRM_EVENTS.includes(ev)) return;
  const body = JSON.stringify({ type: ev, source: srcLabel });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon(CFG.crm + "/events", new Blob([body], { type: "application/json" }));
    else fetch(CFG.crm + "/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  } catch (e) {}
}

function track(ev, d) {
  if (ev !== "page_view") crmEvent(ev);
  if (!can("analytics")) return;
  const s = st.get("stats") || { events: {}, sources: {} };
  s.events[ev] = (s.events[ev] || 0) + 1;
  if (ev === "page_view") s.sources[srcLabel] = (s.sources[srcLabel] || 0) + 1;
  st.set("stats", s);
  if (window.gtag) gtag("event", ev, Object.assign({ source: srcLabel }, d || {}));
}

let pageViewSent = false;
function applyConsent() {
  if (can("analytics")) {
    loadGA();
    if (!pageViewSent) {
      pageViewSent = true;
      track("page_view");
    }
  }
  if (can("external")) loadMap();
}

function loadMap() {
  const f = $("#gmap");
  if (!f || f.src) return;
  f.src = f.dataset.src;
  $("#map-ph").classList.add("hide");
}
$("#map-load").onclick = () => {
  saveConsent(can("analytics"), true);
};

$$("[data-t]").forEach((e) => e.addEventListener("click", () => track("click_" + e.dataset.t)));

function localStats() {
  const s = st.get("stats") || { events: {}, sources: {} };
  return {
    counts: s.events,
    sources: Object.entries(s.sources)
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => ({ source, count })),
  };
}

async function loadStats() {
  if (CFG.crm) {
    try {
      const r = await fetch(CFG.crm + "/events/summary");
      if (r.ok) return { ...(await r.json()), live: true };
    } catch (e) {}
  }
  return { ...localStats(), live: false };
}

async function showStats() {
  $("#stats-body").innerHTML = '<p class="who">Načítavam…</p>';
  $("#stats").classList.remove("hide");
  const data = await loadStats();
  const n = (k) => data.counts[k] || 0;
  const pv = n("page_view"),
    pct = (a, b) => (b ? Math.round((a / b) * 100) + " %" : "–");
  const funnel = [
    ["Návštevy stránky", pv, ""],
    ["Začali kalkulačku", n("calc_start"), pct(n("calc_start"), pv)],
    ["Dokončili výpočet", n("calc_complete"), pct(n("calc_complete"), n("calc_start"))],
    ["Odoslali dopyt (lead)", n("lead_submit"), pct(n("lead_submit"), n("calc_complete"))],
  ];
  const max = Math.max(1, pv);
  $("#stats-body").innerHTML = `
    <h3>Lievik kalkulačky</h3>
    ${funnel
      .map(
        ([l, v, p]) =>
          `<div class="fn"><span>${l}</span><b>${v}</b><small>${p}</small><i style="width:${(v / max) * 100}%"></i></div>`,
      )
      .join("")}
    <div class="kv">
      <div><b>${n("service_submit")}</b>servisné požiadavky</div>
      <div><b>${n("chat_message")}</b>otázky AI asistentovi</div>
    </div>
    <h3>Odkiaľ prichádzajú návštevníci</h3>
    ${
      data.sources.length
        ? `<table class="tb">${data.sources.map((s) => `<tr><td>${esc(s.source)}</td><td>${s.count}</td></tr>`).join("")}</table>`
        : '<p class="who">Zatiaľ žiadne dáta.</p>'
    }
    <p class="who">${
      data.live
        ? "Súhrn všetkých návštevníkov za posledných 30 dní. Meriame bez cookies a bez osobných údajov, ukladá sa iba typ udalosti a zdroj návštevy."
        : "Server je nedostupný, zobrazujú sa iba údaje z tohto prehliadača."
    }</p>`;
}
$("#stats-close").onclick = () => $("#stats").classList.add("hide");
$("#stats-link").onclick = (e) => {
  e.preventDefault();
  showStats();
};

crmEvent("page_view");
if (consent === null) openCookies(false);
else applyConsent();
if (q.has("stats")) showStats();
