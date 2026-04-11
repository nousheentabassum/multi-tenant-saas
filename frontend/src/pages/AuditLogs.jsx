import { useState, useEffect } from "react";
import { audit } from "../api/client";
import styles from "./AuditLogs.module.css";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    audit
      .list()
      .then((d) => setLogs(d.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Loading audit log…</p>
      </div>
    );
  }

  const formatDate = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleString();
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Audit log</h1>
      <p className={styles.subtitle}>Recent actions in your workspace.</p>
      <ul className={styles.list}>
        {logs.length === 0 ? (
          <li className={styles.empty}>No audit entries yet.</li>
        ) : (
          <>
            <li className={styles.headerRow}>
              <span>Action</span>
              <span>Type</span>
              <span>User</span>
              <span>Date</span>
            </li>
            {logs.map((log) => (
            <li key={log._id} className={styles.row}>
              <span className={styles.action}>{log.action}</span>
              <span className={styles.target}>{log.targetType}</span>
              <span className={styles.user}>
                {log.userId?.name ?? "—"}
              </span>
              <span className={styles.date}>{formatDate(log.createdAt)}</span>
            </li>
            ))}
          </>
        )}
      </ul>
    </div>
  );
}
