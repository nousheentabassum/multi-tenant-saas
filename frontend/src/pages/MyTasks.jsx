import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { tasks as tasksApi, users as usersApi } from "../api/client";
import TaskCard from "../components/TaskCard";
import styles from "./MyTasks.module.css";

export default function MyTasks() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = user?.id ?? user?._id;

  const loadTasks = () =>
    tasksApi.list({ assignedTo: userId }).then((d) => setList(d.tasks || []));

  useEffect(() => {
    usersApi.tenant().then((d) => setTenantUsers(d.users || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadTasks()
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Loading your tasks…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My tasks</h1>
      <p className={styles.subtitle}>Tasks assigned to you.</p>
      <ul className={styles.list}>
        {list.length === 0 ? (
          <li className={styles.empty}>
            No tasks assigned to you yet. Ask your admin or manager to assign tasks from a project.
          </li>
        ) : (
          list.map((t) => (
            <TaskCard
              key={t._id}
              task={t}
              currentUser={user}
              tenantUsers={tenantUsers}
              showProjectLink
              onRefresh={loadTasks}
            />
          ))
        )}
      </ul>
    </div>
  );
}
