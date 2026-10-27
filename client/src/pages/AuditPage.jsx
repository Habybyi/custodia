import { useEffect, useRef, useState } from "react";
import { FiFilter, FiRefreshCw, FiSearch, FiX } from "react-icons/fi";
import { AppShell } from "../components/AppShell";
import { PagedList } from "../components/PagedList";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS, ROLE_LABELS } from "../utils/labels";
import { formatDateTime } from "../utils/format";
import styles from "../styles/neumorphic.module.css";

const WARNING_ACTIONS = ["LOGIN_FAILED", "PASSWORD_RESET", "CUSTOMER_DELETED", "CUSTOMER_ANONYMIZED", "USER_UPDATED"];

const GROUPS = [
  ["security", "Bezpečnosť (prihlásenia, heslá, účty)"],
  ["logins", "Len úspešné prihlásenia"],
  ["failed", "Len neúspešné prihlásenia"],
  ["customers", "Zmeny zákazníkov"],
];

const EMPTY_FILTERS = { q: "", userId: "", type: "", ip: "", from: "", to: "" };

const describeDetails = (details) => {
  if (!details || typeof details !== "object") return "";
  return Object.entries(details)
    .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`)
    .join(", ");
};

const BROWSERS = [
  [/Edg\//, "Edge"],
  [/OPR\//, "Opera"],
  [/Firefox\//, "Firefox"],
  [/Chrome\//, "Chrome"],
  [/Safari\//, "Safari"],
  [/curl|python|node|axios|wget/i, "Skript"],
];

const SYSTEMS = [
  [/iPhone/, "iPhone"],
  [/iPad/, "iPad"],
  [/Android/, "Android"],
  [/Mac OS X|Macintosh/, "Mac"],
  [/Windows/, "Windows"],
  [/Linux/, "Linux"],
];

const describeDevice = (ua) => {
  if (!ua) return "";
  const browser = BROWSERS.find(([re]) => re.test(ua))?.[1] || "Iný prehliadač";
  const os = SYSTEMS.find(([re]) => re.test(ua))?.[1];
  return os ? `${browser} na ${os}` : browser;
};

const toQuery = (f) => {
  const query = { pageSize: 100, q: f.q, userId: f.userId, ip: f.ip, from: f.from, to: f.to };
  if (f.type.startsWith("group:")) query.group = f.type.slice(6);
  else if (f.type) query.action = f.type;
  return query;
};

export const AuditPage = () => {
  const { token } = useAuth();
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [ipInfo, setIpInfo] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const appliedRef = useRef(applied);

  const load = async (f = appliedRef.current) => {
    setIsLoading(true);
    setError("");
    try {
      const data = await api.listAudit(token, toQuery(f));
      setEntries(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    api
      .listAuditUsers(token)
      .then(setUsers)
      .catch(() => setUsers([]));
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => setApplied(filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    appliedRef.current = applied;
    load(applied);
    const timer = setInterval(() => load(), 10000);
    return () => clearInterval(timer);
  }, [token, applied]);

  useEffect(() => {
    const ip = applied.ip.trim();
    if (!/^[0-9a-fA-F.:]{3,}$/.test(ip)) {
      setIpInfo(null);
      return;
    }
    api
      .getIpSummary(token, ip)
      .then(setIpInfo)
      .catch(() => setIpInfo(null));
  }, [token, applied.ip]);

  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const filterByIp = (ip) => {
    setFilters((f) => ({ ...f, ip }));
    setShowFilters(true);
  };
  const activeCount = Object.values(filters).filter(Boolean).length;
  const isFiltered = activeCount > 0;

  const EntryRow = ({ entry }) => {
    const details = describeDetails(entry.details);
    const who = entry.user?.name || entry.details?.email || "Systém";
    const device = describeDevice(entry.userAgent);
    return (
      <div className={`${styles.listCard} ${styles.fixedRow} ${styles.logRow}`}>
        <span className={styles.listCardMain}>
          <span className={styles.listCardTitle}>
            {AUDIT_ACTION_LABELS[entry.action] || entry.action} · {who}
          </span>
          <span className={styles.listCardMeta} title={details}>
            {entry.ip ? (
              <button type="button" className={styles.linkButton} onClick={() => filterByIp(entry.ip)} title="Zobraziť všetko z tejto IP">
                {entry.ip}
              </button>
            ) : (
              "IP neznáma"
            )}
            {device && ` · ${device}`} · {AUDIT_ENTITY_LABELS[entry.entityType] || entry.entityType}
            {details && ` · ${details}`}
          </span>
        </span>
        {WARNING_ACTIONS.includes(entry.action) && <span className={styles.badgeBrand}>Pozor</span>}
        <span className={styles.logTime}>{formatDateTime(entry.createdAt)}</span>
      </div>
    );
  };

  return (
    <AppShell>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Logy</h1>
          <p className={styles.muted} style={{ margin: "0.2rem 0 0" }}>
            {total > entries.length
              ? `Zobrazených posledných ${entries.length} z ${total} záznamov.`
              : `${total} ${total === 1 ? "záznam" : total >= 2 && total <= 4 ? "záznamy" : "záznamov"}.`}
          </p>
        </div>
        <div className={styles.buttonRow}>
          <button type="button" className={styles.secondaryButton} onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
            <FiFilter /> {showFilters ? "SKRYŤ FILTRE" : "FILTRE"}
            {activeCount > 0 && <span className={styles.filterCount}>{activeCount}</span>}
          </button>
          {isFiltered && (
            <button type="button" className={styles.secondaryButton} onClick={() => setFilters(EMPTY_FILTERS)}>
              <FiX /> ZRUŠIŤ FILTRE
            </button>
          )}
          <button type="button" className={styles.secondaryButton} onClick={() => load()} disabled={isLoading}>
            <FiRefreshCw /> {isLoading ? "NAČÍTAVAM…" : "OBNOVIŤ"}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className={styles.toolbar}>
          <div className={`${styles.inputWrapper} ${styles.toolbarSearch}`}>
            <FiSearch />
            <input className={styles.input} placeholder="Hľadať meno, e-mail alebo IP" value={filters.q} onChange={set("q")} />
          </div>
          <div className={styles.inputWrapper} style={{ flex: "1 1 180px" }}>
            <select className={styles.select} value={filters.userId} onChange={set("userId")} aria-label="Používateľ">
              <option value="">Každý používateľ</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({ROLE_LABELS[u.role] || u.role})
                </option>
              ))}
            </select>
          </div>
          <div className={styles.inputWrapper} style={{ flex: "1 1 220px" }}>
            <select className={styles.select} value={filters.type} onChange={set("type")} aria-label="Typ udalosti">
              <option value="">Každá udalosť</option>
              <optgroup label="Skupiny">
                {GROUPS.map(([value, label]) => (
                  <option key={value} value={`group:${value}`}>
                    {label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Konkrétna udalosť">
                {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div className={styles.inputWrapper} style={{ flex: "1 1 150px" }}>
            <input className={styles.input} placeholder="IP adresa" value={filters.ip} onChange={set("ip")} aria-label="IP adresa" />
          </div>
          <div className={styles.inputWrapper} style={{ flex: "1 1 140px" }} title="Od dátumu">
            <input className={styles.input} type="date" value={filters.from} onChange={set("from")} aria-label="Od dátumu" />
          </div>
          <div className={styles.inputWrapper} style={{ flex: "1 1 140px" }} title="Do dátumu">
            <input className={styles.input} type="date" value={filters.to} onChange={set("to")} aria-label="Do dátumu" />
          </div>
        </div>
      )}

      {ipInfo && ipInfo.lastSeen && (
        <div className={styles.listCard} style={{ marginBottom: "1rem" }}>
          <span className={styles.listCardMain}>
            <span className={styles.listCardTitle}>IP {ipInfo.ip}</span>
            <span className={styles.listCardMeta}>
              Prvýkrát {formatDateTime(ipInfo.firstSeen)} · naposledy {formatDateTime(ipInfo.lastSeen)} ·{" "}
              {ipInfo.users.length ? `účty: ${ipInfo.users.map((u) => u.name).join(", ")}` : "žiadny prihlásený účet"}
            </span>
          </span>
          {ipInfo.failedLogins > 0 && <span className={styles.badgeBrand}>{ipInfo.failedLogins}× zlé heslo</span>}
        </div>
      )}

      {error && (
        <div className={styles.errorMessage} style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <PagedList
        items={entries}
        rowHeight={58}
        renderItem={(entry) => <EntryRow entry={entry} />}
        empty={<p className={styles.emptyState}>{isFiltered ? "Filtru nezodpovedá žiadny záznam." : "Zatiaľ žiadne záznamy."}</p>}
      />
    </AppShell>
  );
};
