import { useCallback, useEffect, useState } from "react";
import { FiUserPlus, FiKey, FiUserX, FiUserCheck } from "react-icons/fi";
import { AppShell } from "../components/AppShell";
import { Field } from "../components/Field";
import { Modal } from "../components/Modal";
import { PagedList } from "../components/PagedList";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { ROLE_LABELS } from "../utils/labels";
import { CopyButton } from "../components/CopyButton";
import styles from "../styles/neumorphic.module.css";

const EMPTY_FORM = { name: "", email: "", phone: "", role: "TECHNICIAN" };

export const TeamPage = () => {
  const { token, user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.listUsers(token, { pageSize: 100 });
      setUsers(data.items);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const updateForm = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const data = await api.createUser(token, form);
      setCredentials({ name: data.user.name, email: data.user.email, password: data.tempPassword });
      setForm(EMPTY_FORM);
      setIsAdding(false);
      load();
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.fields || {});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (u) => {
    const action = u.isActive ? "deaktivovať" : "znova aktivovať";
    if (!window.confirm(`Naozaj chceš ${action} účet ${u.name}?`)) return;
    try {
      await api.updateUser(token, u.id, { isActive: !u.isActive });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = async (u) => {
    if (!window.confirm(`Vygenerovať nové dočasné heslo pre ${u.name}?`)) return;
    try {
      const data = await api.resetPassword(token, u.id);
      setCredentials({ name: u.name, email: u.email, password: data.tempPassword });
    } catch (err) {
      setError(err.message);
    }
  };


  const UserRow = ({ u }) => (
    <div className={`${styles.listCard} ${styles.fixedRow}`} style={u.isActive ? undefined : { opacity: 0.55 }}>
      <span className={styles.listCardMain}>
        <span className={styles.listCardTitle}>{u.name}</span>
        <span className={styles.listCardMeta}>
          {u.email} · {!u.isActive ? "neaktívny" : u.mustChangePassword ? "čaká na prvé prihlásenie" : "aktívny"}
        </span>
      </span>
      <span className={u.role === "OWNER" ? styles.badgeBrand : styles.badgeGreen}>{ROLE_LABELS[u.role]}</span>
      {u.id !== me.id && (
        <>
          <button type="button" className={styles.iconButton} onClick={() => handleReset(u)} title="Nové dočasné heslo">
            <FiKey />
          </button>
          <button type="button" className={styles.iconButton} onClick={() => handleToggleActive(u)} title={u.isActive ? "Deaktivovať" : "Aktivovať"}>
            {u.isActive ? <FiUserX /> : <FiUserCheck />}
          </button>
        </>
      )}
    </div>
  );

  return (
    <AppShell>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Tím</h1>
        <button type="button" className={styles.primaryButtonInline} onClick={() => setIsAdding(true)}>
          <FiUserPlus /> PRIDAŤ ČLENA
        </button>
      </div>

      {error && <div className={styles.errorMessage} style={{ marginBottom: "1rem" }}>{error}</div>}

      <PagedList items={users} renderItem={(u) => <UserRow u={u} />} empty={<p className={styles.emptyState}>Žiadni používatelia.</p>} />

      {isAdding && (
        <Modal title="Pridať člena tímu" onClose={() => setIsAdding(false)}>
          <form onSubmit={handleCreate} className={styles.form}>
            <div className={styles.formRow}>
              <Field label="Meno a priezvisko" error={fieldErrors.name}>
                <input className={styles.input} value={form.name} onChange={updateForm("name")} required autoFocus />
              </Field>
              <Field label="E-mail (prihlasovacie meno)" error={fieldErrors.email}>
                <input type="email" className={styles.input} value={form.email} onChange={updateForm("email")} required />
              </Field>
            </div>
            <div className={styles.formRow}>
              <Field label="Telefón" error={fieldErrors.phone}>
                <input type="tel" className={styles.input} value={form.phone} onChange={updateForm("phone")} />
              </Field>
              <Field label="Rola" error={fieldErrors.role}>
                <select className={styles.select} value={form.role} onChange={updateForm("role")}>
                  <option value="TECHNICIAN">Technik / brigádnik</option>
                  <option value="OWNER">Majiteľ</option>
                </select>
              </Field>
            </div>
            <div className={styles.buttonRow} style={{ justifyContent: "flex-end" }}>
              <button type="submit" className={styles.primaryButtonInline} disabled={isSubmitting}>
                <FiUserPlus /> {isSubmitting ? "PRIDÁVAM…" : "PRIDAŤ"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {credentials && (
        <Modal title={`Prihlasovacie údaje: ${credentials.name}`} onClose={() => setCredentials(null)}>
          <div className={styles.calloutBox}>
            E-mail: <strong>{credentials.email}</strong>
            <br />
            Dočasné heslo: <code style={{ fontSize: "1.1rem" }}>{credentials.password}</code>
          </div>
          <p className={styles.muted}>Heslo sa zobrazí len teraz. Pri prvom prihlásení si ho technik zmení.</p>
          <div className={styles.buttonRow} style={{ justifyContent: "flex-end" }}>
            <CopyButton text={credentials.password} />
            <button type="button" className={styles.primaryButtonInline} onClick={() => setCredentials(null)}>
              HOTOVO
            </button>
          </div>
        </Modal>
      )}
    </AppShell>
  );
};
