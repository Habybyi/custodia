import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import styles from "../styles/neumorphic.module.css";

export const PasswordInput = ({ ref, ...props }) => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <input ref={ref} {...props} type={visible ? "text" : "password"} className={styles.input} />
      <button
        type="button"
        className={styles.revealButton}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Skryť heslo" : "Zobraziť heslo"}
        aria-pressed={visible}
        title={visible ? "Skryť heslo" : "Zobraziť heslo"}
      >
        {visible ? <FiEyeOff /> : <FiEye />}
      </button>
    </>
  );
};
