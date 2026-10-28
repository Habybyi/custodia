import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiEdit2,
  FiPhone,
  FiMail,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiUser,
  FiHome,
  FiInbox,
  FiChevronRight,
  FiDownload,
  FiGlobe,
} from "react-icons/fi";
import { AppShell } from "../components/AppShell";
import { Section } from "../components/Section";
import { PagedList } from "../components/PagedList";
import { TabBar, useTab } from "../components/Tabs";
import { InfoItem } from "../components/InfoItem";
import { RequestCard } from "../components/RequestCard";
import { PortalAccessPanel } from "../components/PortalAccessPanel";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import {
  CONTACT_LABELS,
  CUSTOMER_STATUS_LABELS,
  SOURCE_LABELS,
  WATER_SOURCE_LABELS,
} from "../utils/labels";
import { formatDate, fullName, gardenAddress, mapsUrl } from "../utils/format";
import styles from "../styles/neumorphic.module.css";

export const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const tabs = [
    { key: "contact", label: "Kontakt", icon: FiUser },
    { key: "gardens", label: "Záhrady", icon: FiHome, count: customer?.gardens.length },
    { key: "requests", label: "Požiadavky", icon: FiInbox, count: customer?.serviceRequests.length },
    ...(user.role === "OWNER" ? [{ key: "portal", label: "Portál", icon: FiGlobe }] : []),
  ];
  const [tab, setTab] = useTab(tabs);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api
      .getCustomer(token, id)
      .then((d) => setCustomer(d.customer))
      .catch((err) => setError(err.message));
  }, [token, id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async () => {
    try {
      const blob = await api.exportCustomer(token, id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `zakaznik-${customer.lastName || id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Naozaj natrvalo zmazať zákazníka ${fullName(customer)}?\n\nZmažú sa aj jeho záhrady, požiadavky, termíny, história výjazdov, fotky, IoT zariadenia a prístup do portálu. Toto sa nedá vrátiť.`)) return;
    try {
      await api.deleteCustomer(token, id);
      navigate("/customers");
    } catch (err) {
      setError(err.message);
    }
  };

  if (!customer) {
    return (
      <AppShell>
        {error ? <div className={styles.errorMessage}>{error}</div> : <p className={styles.muted}>Načítavam…</p>}
      </AppShell>
    );
  }

  const billing = [customer.billingStreet, [customer.billingPostalCode, customer.billingCity].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  return (
    <AppShell>
      <Link to="/customers" className={styles.backLink}>
        <FiArrowLeft /> Zákazníci
      </Link>

      <div className={styles.splitHeader}>
        <div>
          <h1 className={styles.pageTitle}>{fullName(customer)}</h1>
          <div className={styles.chipRow} style={{ marginTop: "0.5rem" }}>
            <span className={customer.status === "ACTIVE" ? styles.badgeGreen : styles.badge}>
              {CUSTOMER_STATUS_LABELS[customer.status]}
            </span>
            {customer.companyName && <span className={styles.badge}>{customer.companyName}</span>}
          </div>
        </div>
        <div className={styles.buttonRow}>
          {customer.phone && (
            <a href={`tel:${customer.phone.replace(/\s/g, "")}`} className={styles.primaryButtonInline} style={{ textDecoration: "none" }}>
              <FiPhone /> ZAVOLAŤ
            </a>
          )}
          {customer.email && (
            <a href={`mailto:${customer.email}`} className={styles.secondaryButton} style={{ textDecoration: "none" }}>
              <FiMail /> E-mail
            </a>
          )}
          <Link to={`/customers/${id}/edit`} className={styles.secondaryButton} style={{ textDecoration: "none" }}>
            <FiEdit2 /> Upraviť
          </Link>
          {user.role === "OWNER" && (
            <button type="button" className={styles.dangerButton} onClick={handleDelete} title="Odstrániť zákazníka">
              <FiTrash2 />
            </button>
          )}
        </div>
      </div>

      {error && <div className={styles.errorMessage} style={{ marginBottom: "1rem" }}>{error}</div>}

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      <div className={styles.tabPanel}>
        {tab === "contact" && (
          <Section
            title="Kontakt"
            icon={FiUser}
            actions={
              user.role === "OWNER" && (
                <button type="button" className={styles.secondaryButton} onClick={handleExport} title="Export všetkých údajov (GDPR)">
                  <FiDownload /> Export údajov
                </button>
              )
            }
          >
            <div className={styles.infoGrid}>
              <InfoItem label="Telefón">{customer.phone}</InfoItem>
              <InfoItem label="E-mail">{customer.email}</InfoItem>
              <InfoItem label="Preferuje">{CONTACT_LABELS[customer.preferredContact]}</InfoItem>
              <InfoItem label="Odkiaľ prišiel">{SOURCE_LABELS[customer.source]}</InfoItem>
              <InfoItem label="Fakturačná adresa">{billing || "rovnaká ako záhrada"}</InfoItem>
              <InfoItem label="Zákazník od">{formatDate(customer.createdAt)}</InfoItem>
              <InfoItem label="Servisné pripomienky">{customer.serviceReminders ? "posielať" : "odhlásený"}</InfoItem>
            </div>
            {customer.notes && (
              <div className={styles.calloutBox} style={{ marginTop: "1rem", whiteSpace: "pre-wrap", maxHeight: "8rem", overflow: "hidden" }}>
                {customer.notes}
              </div>
            )}
          </Section>
        )}

        {tab === "gardens" && (
          <section className={styles.panelFill}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <FiHome /> Záhrady
              </h2>
              <Link to={`/customers/${id}/gardens/new`} className={styles.secondaryButton} style={{ textDecoration: "none" }}>
                <FiPlus /> Pridať záhradu
              </Link>
            </div>
            <PagedList
              items={customer.gardens}
              rowHeight={84}
              empty={<p className={styles.emptyState}>Zákazník zatiaľ nemá žiadnu záhradu.</p>}
              renderItem={(g) => (
                <div className={`${styles.listCard} ${styles.fixedRow}`} style={{ height: 84 }}>
                  <Link to={`/gardens/${g.id}`} className={styles.listCardMain} style={{ color: "inherit", textDecoration: "none" }}>
                    <span className={styles.listCardTitle}>{g.label}</span>
                    <span className={styles.listCardMeta}>{gardenAddress(g)}</span>
                    <span className={styles.chipRow} style={{ flexWrap: "nowrap", overflow: "hidden" }}>
                      <span className={styles.badgeGreen}>{g._count.zones} zón</span>
                      <span className={styles.badge}>{WATER_SOURCE_LABELS[g.waterSource]}</span>
                      {g.installedYear && <span className={styles.badge}>od {g.installedYear}</span>}
                      {g.isSmartController && <span className={styles.badgeBrand}>smart</span>}
                    </span>
                  </Link>
                  <a href={mapsUrl(g)} target="_blank" rel="noreferrer" className={styles.iconButton} title="Otvoriť v mapách">
                    <FiMapPin />
                  </a>
                  <Link to={`/gardens/${g.id}`} className={styles.iconButton} title="Technická karta">
                    <FiChevronRight />
                  </Link>
                </div>
              )}
            />
          </section>
        )}

        {tab === "portal" && user.role === "OWNER" && <PortalAccessPanel customer={customer} />}

        {tab === "requests" && (
          <section className={styles.panelFill}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <FiInbox /> Posledné požiadavky
              </h2>
              <Link to={`/requests/new?customerId=${id}`} className={styles.secondaryButton} style={{ textDecoration: "none" }}>
                <FiPlus /> Nová požiadavka
              </Link>
            </div>
            <PagedList
              items={customer.serviceRequests}
              empty={<p className={styles.emptyState}>Žiadne požiadavky.</p>}
              renderItem={(r) => <RequestCard request={r} showCustomer={false} fixed />}
            />
          </section>
        )}
      </div>
    </AppShell>
  );
};
