import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail } from "react-icons/fi";
import { BrandHeader } from "../components/BrandHeader";
import { Field } from "../components/Field";
import { api } from "../api/client";
import styles from "../styles/neumorphic.module.css";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <BrandHeader />
        {sent ? (
          <div className={styles.form}>
            <div className={styles.calloutBox}>
              Ak k e-mailu <strong>{email}</strong> existuje účet, poslali sme naň odkaz na nastavenie nového hesla. Platí 60 minút.
            </div>
            <p className={styles.muted} style={{ margin: 0 }}>
              E-mail neprišiel? Pozri priečinok spam alebo požiadaj Milana o dočasné heslo.
            </p>
            <Link to="/login" className={styles.primaryButton} style={{ textDecoration: "none", textAlign: "center" }}>
              SPÄŤ NA PRIHLÁSENIE
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <p className={styles.subtitle} style={{ margin: 0 }}>
              Zabudnuté heslo
            </p>
            <p className={styles.muted} style={{ margin: 0 }}>
              Zadaj e-mail, ktorým sa prihlasuješ. Pošleme ti odkaz na nastavenie nového hesla.
            </p>
            <Field icon={FiMail}>
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                autoComplete="username"
                required
                autoFocus
              />
            </Field>
            {error && <div className={styles.errorMessage}>{error}</div>}
            <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
              {isSubmitting ? "POSIELAM…" : "POSLAŤ ODKAZ"}
            </button>
            <Link to="/login" className={styles.linkButton} style={{ alignSelf: "center" }}>
              Späť na prihlásenie
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};
