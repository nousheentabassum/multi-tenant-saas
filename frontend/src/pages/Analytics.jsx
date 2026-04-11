import { useState, useEffect } from "react";
import { tasks } from "../api/client";
import styles from "./Analytics.module.css";

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    tasks
      .analytics()
      .then((d) => {
        setStats(d.stats || {});
        setCached(!!d.cached);
      })
      .catch((err) => {
        setStats(null);
        setError(err.status === 403 ? "You don’t have permission to view analytics." : (err.message || "Failed to load analytics. Try again."));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Loading analytics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Task analytics</h1>
        <div className={styles.errorMsg}>{error}</div>
      </div>
    );
  }

  const s = stats || {};
  const todo = s.TODO ?? 0;
  const inProgress = s.IN_PROGRESS ?? 0;
  const done = s.DONE ?? 0;
  const overdue = s.overdue ?? 0;
  const total = todo + inProgress + done;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Task analytics</h1>
      {cached && <p className={styles.cached}>From cache (refreshes every 2 min)</p>}
      <div className={styles.grid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{todo}</span>
          <span className={styles.statLabel}>To do</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{inProgress}</span>
          <span className={styles.statLabel}>In progress</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{done}</span>
          <span className={styles.statLabel}>Done</span>
        </div>
        <div className={`${styles.statCard} ${styles.overdue}`}>
          <span className={styles.statValue}>{overdue}</span>
          <span className={styles.statLabel}>Overdue</span>
        </div>
      </div>
      {total > 0 && (
        <div className={styles.bar}>
          <div
            className={styles.barSegment}
            style={{ width: `${(done / total) * 100}%`, background: "#22c55e" }}
          />
          <div
            className={styles.barSegment}
            style={{ width: `${(inProgress / total) * 100}%`, background: "#eab308" }}
          />
          <div
            className={styles.barSegment}
            style={{ width: `${(todo / total) * 100}%`, background: "#94a3b8" }}
          />
        </div>
      )}
    </div>
  );
}
