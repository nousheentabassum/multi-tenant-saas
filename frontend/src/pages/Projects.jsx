import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { projects as projectsApi } from "../api/client";
import { canCreateProjects } from "../utils/role";
import styles from "./Projects.module.css";

export default function Projects() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const canCreate = canCreateProjects(user);

  const load = () => {
    setLoading(true);
    projectsApi
      .list()
      .then((d) => setList(d.projects || []))
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim() || !canCreate) return;
    setCreating(true);
    setError("");
    projectsApi
      .create(newName.trim())
      .then(() => {
        setNewName("");
        load();
      })
      .catch((e) => setError(e.message || "Failed to create"))
      .finally(() => setCreating(false));
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Loading projects…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Projects</h1>
        {canCreate && (
          <form onSubmit={handleCreate} className={styles.createForm}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New project name"
              className={styles.input}
            />
            <button type="submit" disabled={creating} className={styles.btn}>
              {creating ? "Creating…" : "Add project"}
            </button>
          </form>
        )}
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <ul className={styles.list}>
        {list.length === 0 ? (
          <li className={styles.empty}>No projects yet.</li>
        ) : (
          list.map((p) => (
            <li key={p._id}>
              <Link to={`/projects/${p._id}`} className={styles.card}>
                <span className={styles.cardTitle}>{p.name}</span>
                <span className={styles.cardMeta}>View tasks →</span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
