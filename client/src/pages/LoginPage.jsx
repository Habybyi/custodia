import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { BrandHeader } from "../components/BrandHeader";
import { Field } from "../components/Field";
import { PasswordInput } from "../components/PasswordInput";
import styles from "../styles/neumorphic.module.css";

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();
  const from = location.state?.from && location.state.from !== "/login" ? location.state.from : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordStep, setIsPasswordStep] = useState(false);
  const passwordRef = useRef(null);

  useEffect(() => {
    if (isPasswordStep) passwordRef.current?.focus();
  }, [isPasswordStep]);

  if (user) return <Navigate to={from} replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!isPasswordStep) {
      setIsPasswordStep(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const loggedIn = await login(email, password);
      navigate(loggedIn.mustChangePassword ? "/change-password" : from, { replace: true });
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
        <form onSubmit={handleLogin} className={styles.form}>
          <Field icon={FiMail}>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              autoComplete="username"
              readOnly={isPasswordStep}
              required
            />
          </Field>

          {isPasswordStep && (
            <div className={styles.slideDown}>
              <Field icon={FiLock}>
                <PasswordInput
                  ref={passwordRef}
                  placeholder="Heslo"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </Field>
            </div>
          )}

          {error && <div className={styles.errorMessage}>{error}</div>}

          <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
            {!isPasswordStep ? "POKRAČOVAŤ" : isSubmitting ? "PRIHLASUJEM…" : "PRIHLÁSIŤ SA"}
          </button>

          {isPasswordStep && (
            <button
              type="button"
              className={styles.linkButton}
              style={{ alignSelf: "center" }}
              onClick={() => {
                setIsPasswordStep(false);
                setPassword("");
                setError("");
              }}
            >
              Zmeniť e-mail
            </button>
          )}
        </form>
        <Link to="/forgot-password" className={styles.linkButton} style={{ display: "block", textAlign: "center", marginTop: "1rem" }}>
          Zabudli ste heslo?
        </Link>
        <a href="/" className={styles.linkButton} style={{ display: "block", textAlign: "center", marginTop: "1rem" }}>
          Späť na web Custodia
        </a>
      </div>
    </div>
  );
};
