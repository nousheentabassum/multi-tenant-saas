import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { users as usersApi } from "../api/client";          
import { canAddUsers } from "../utils/role";
import styles from "./Users.module.css";

export default function Users() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "MEMBER" });
  const [submitting, setSubmitting] = useState(false);
  const canAdd = canAddUsers(user);

  const load = () => {
    setLoading(true);
    usersApi
      .tenant()
      .then((d) => setList(d.users || []))
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.email?.trim() || !form.password?.trim()) return;
    setSubmitting(true);
    setError("");
    usersApi
      .add(form)
      .then(() => {
        setForm({ name: "", email: "", password: "", role: "MEMBER" });
        setShowForm(false);
        load();
      })
      .catch((e) => setError(e.message || "Failed to add user"))
      .finally(() => setSubmitting(false));
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Loading team…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Team</h1>
        {canAdd && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className={styles.toggleBtn}
          >
            {showForm ? "Cancel" : "Add user"}
          </button>
        )}
      </div>
      {error && <div className={styles.error}>{error}</div>}
      {showForm && canAdd && (
        <form onSubmit={handleAdd} className={styles.form}>
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className={styles.input}
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            minLength={6}
            className={styles.input}
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className={styles.select}
          >
            <option value="MEMBER">Member</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" disabled={submitting} className={styles.btn}>
            {submitting ? "Adding…" : "Add"}
          </button>
        </form>
      )}
      <ul className={styles.list}>
        {list.map((u) => (
          <li key={u._id || u.id} className={styles.card}>
            <div>
              <span className={styles.name}>{u.name}</span>
              <span className={styles.email}>{u.email}</span>
            </div>
            <span className={styles.role}>{u.role}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
