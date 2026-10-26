import { useCallback, useEffect, useState } from "react";
import { FiKey, FiGlobe, FiUserCheck, FiUserX } from "react-icons/fi";
import { Section } from "./Section";
import { Modal } from "./Modal";
import { InfoItem } from "./InfoItem";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { formatDate } from "../utils/format";
import { CopyButton } from "./CopyButton";
import styles from "../styles/neumorphic.module.css";

export const PortalAccessPanel = ({ customer }) => {
  const { token } = useAuth();
  const [account, setAccount] = useState(undefined);
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api
      .getPortalAccount(token, customer.id)
      .then((d) => setAccount(d.account))
      .catch((err) => setError(err.message));
  }, [token, customer.id]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action) => {
    setError("");
    try {
      const data = await action();
      if (data?.account) setAccount(data.account);
      if (data?.tempPassword) setCredentials({ email: data.account.email, password: data.tempPassword });
    } catch (err) {
      setError(err.message);
    }
  };

  const portalUrl = `${window.location.origin}/login`;

  const state = !account ? "bez prístupu" : !account.isActive ? "vypnutý" : account.mustChangePassword ? "čaká na prvé prihlásenie" : "aktívny";

  return (
    <Section
      title="Zákaznícky portál"
      icon={FiGlobe}
      actions={
        account === null ? (
          <button type="button" className={styles.primaryButtonInline} onClick={() => run(() => api.createPortalAccount(token, customer.id))}>
            <FiUserCheck /> VYTVORIŤ PRÍSTUP
          </button>
        ) : account ? (
          <>
            <button type="button" className={styles.secondaryButton} onClick={() => run(() => api.resetPortalPassword(token, customer.id))}>
              <FiKey /> Nové dočasné heslo
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => run(() => api.setPortalActive(token, customer.id, !account.isActive))}>
              {account.isActive ? <FiUserX /> : <FiUserCheck />} {account.isActive ? "Vypnúť prístup" : "Zapnúť prístup"}
            </button>
          </>
        ) : null
      }
    >
      <p className={styles.muted} style={{ marginTop: 0 }}>
        V portáli zákazník vidí svoje záhrady, senzory, termíny a históriu servisu, nahlási poruchu a stiahne si svoje údaje (GDPR). Interné poznámky
        firmy nevidí.
      </p>
      <div className={styles.infoGrid}>
        <InfoItem label="Stav">{account === undefined ? "načítavam…" : state}</InfoItem>
        <InfoItem label="Prihlasovací e-mail">{account?.email || customer.email || "chýba, doplň e-mail v karte"}</InfoItem>
        <InfoItem label="Vytvorený">{account ? formatDate(account.createdAt) : ""}</InfoItem>
      </div>
      {error && <div className={styles.errorMessage} style={{ marginTop: "0.75rem" }}>{error}</div>}

      {credentials && (
        <Modal title="Prístup do portálu" onClose={() => setCredentials(null)}>
          <div className={styles.calloutBox}>
            Adresa: <strong>{portalUrl}</strong>
            <br />
            E-mail: <strong>{credentials.email}</strong>
            <br />
            Dočasné heslo: <code style={{ fontSize: "1.1rem" }}>{credentials.password}</code>
          </div>
          <p className={styles.muted}>Heslo sa zobrazí len teraz. Pri prvom prihlásení si ho zákazník zmení.</p>
          <div className={styles.buttonRow} style={{ justifyContent: "flex-end" }}>
            <CopyButton text={credentials.password} />
            <button type="button" className={styles.primaryButtonInline} onClick={() => setCredentials(null)}>
              HOTOVO
            </button>
          </div>
        </Modal>
      )}
    </Section>
  );
};
