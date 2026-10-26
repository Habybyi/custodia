import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiLock } from "react-icons/fi";
import { BrandHeader } from "../components/BrandHeader";
import { Field } from "../components/Field";
import { PasswordInput } from "../components/PasswordInput";
import { api } from "../api/client";
import styles from "../styles/neumorphic.module.css";

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Heslá sa nezhodujú." });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.resetPasswordWithLink(token, newPassword);
      setDone(true);
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.fields || {});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <BrandHeader />
        {done ? (
          <div className={styles.form}>
            <div className={styles.calloutBox}>Heslo je zmenené. Teraz sa môžeš prihlásiť novým heslom.</div>
            <Link to="/login" className={styles.primaryButton} style={{ textDecoration: "none", textAlign: "center" }}>
              PRIHLÁSIŤ SA
            </Link>
          </div>
        ) : !token ? (
          <div className={styles.form}>
            <div className={styles.errorMessage}>Odkaz na obnovu hesla je neúplný. Otvor ho priamo z e-mailu.</div>
            <Link to="/forgot-password" className={styles.linkButton} style={{ alignSelf: "center" }}>
              Poslať nový odkaz
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <p className={styles.subtitle} style={{ margin: 0 }}>
              Nastav si nové heslo
            </p>
            <Field icon={FiLock} error={fieldErrors.newPassword}>
              <PasswordInput
                placeholder="Nové heslo (aspoň 8 znakov, písmeno aj číslo)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                autoFocus
              />
            </Field>
            <Field icon={FiLock} error={fieldErrors.confirmPassword}>
              <PasswordInput
                placeholder="Nové heslo znova"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </Field>
            {error && <div className={styles.errorMessage}>{error}</div>}
            <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
              {isSubmitting ? "UKLADÁM…" : "ULOŽIŤ NOVÉ HESLO"}
            </button>
            {error && (
              <Link to="/forgot-password" className={styles.linkButton} style={{ alignSelf: "center" }}>
                Poslať nový odkaz
              </Link>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
