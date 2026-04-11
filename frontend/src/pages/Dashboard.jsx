import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { projects, tasks } from "../api/client";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { user } = useAuth();
  const [projectCount, setProjectCount] = useState(0);
  const [taskCounts, setTaskCounts] = useState({ TODO: 0, IN_PROGRESS: 0, DONE: 0 });

  useEffect(() => {
    projects
      .list()
      .then((d) => setProjectCount(d.projects?.length ?? 0))
      .catch(() => {});
    tasks
      .list()
      .then((d) => {
        const list = d.tasks || [];
        setTaskCounts({
          TODO: list.filter((t) => t.status === "TODO").length,
          IN_PROGRESS: list.filter((t) => t.status === "IN_PROGRESS").length,
          DONE: list.filter((t) => t.status === "DONE").length,
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.welcome}>
        Hello, {user?.name ?? "User"}
        {user?.tenant && (
          <span className={styles.tenant}> · {user.tenant}</span>
        )}
      </h1>
      <p className={styles.subtitle}>Here’s your workspace at a glance.</p>

      <div className={styles.grid}>
        <Link to="/projects" className={styles.card}>
          <span className={styles.cardIcon}>📁</span>
          <span className={styles.cardValue}>{projectCount}</span>
          <span className={styles.cardLabel}>Projects</span>
        </Link>
        <div className={styles.card}>
          <span className={styles.cardIcon}>📋</span>
          <span className={styles.cardValue}>{taskCounts.TODO}</span>
          <span className={styles.cardLabel}>To do</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardIcon}>🔄</span>
          <span className={styles.cardValue}>{taskCounts.IN_PROGRESS}</span>
          <span className={styles.cardLabel}>In progress</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardIcon}>✅</span>
          <span className={styles.cardValue}>{taskCounts.DONE}</span>
          <span className={styles.cardLabel}>Done</span>
        </div>
      </div>

      {projectCount === 0 && (
        <div className={styles.getStarted}>
          <p className={styles.getStartedText}>Get started by creating your first project.</p>
          <Link to="/projects" className={styles.getStartedBtn}>Create your first project</Link>
        </div>
      )}

      <div className={styles.actions}>
        <Link to="/projects" className={styles.primaryBtn}>
          View projects
        </Link>
        <Link to="/tasks" className={styles.secondaryBtn}>
          View all tasks
        </Link>
      </div>
    </div>
  );
}
