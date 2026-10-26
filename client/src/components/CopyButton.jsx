import { useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";
import styles from "../styles/neumorphic.module.css";

export const CopyButton = ({ text, label = "Kopírovať heslo" }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" className={styles.secondaryButton} onClick={copy}>
      {copied ? <FiCheck /> : <FiCopy />} {copied ? "Skopírované" : label}
    </button>
  );
};
