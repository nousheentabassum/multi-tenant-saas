import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { projects as projectsApi, tasks as tasksApi, users as usersApi } from "../api/client";
import { canManageTasks } from "../utils/role";
import TaskCard from "../components/TaskCard";
import styles from "./ProjectDetail.module.css";

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [taskList, setTaskList] = useState([]);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [creating, setCreating] = useState(false);
  const canManage = canManageTasks(user);

  const loadTasks = () =>
    tasksApi.list({ projectId: id }).then((r) => setTaskList(r.tasks || []));

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      projectsApi.list(),
      tasksApi.list({ projectId: id }),
      usersApi.tenant(),
    ])
      .then(([projRes, taskRes, usersRes]) => {
        const p = (projRes.projects || []).find((x) => x._id === id);
        setProject(p || null);
        setTaskList(taskRes.tasks || []);
        setTenantUsers(usersRes.users || []);
      })
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !id || !canManage) return;
    setCreating(true);
    setError("");
    const payload = {
      title: newTitle.trim(),
      projectId: id,
      description: newDescription.trim() || undefined,
      dueDate: newDueDate ? new Date(newDueDate).toISOString() : undefined,
      assignedTo: newAssignedTo || undefined,
    };
    tasksApi
      .create(payload)
      .then(() => {
        setNewTitle("");
        setNewDescription("");
        setNewDueDate("");
        setNewAssignedTo("");
        return loadTasks();
      })
      .catch((e) => setError(e.message || "Failed to create"))
      .finally(() => setCreating(false));
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Loading…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>Project not found.</p>
        <Link to="/projects">← Back to projects</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to="/projects" className={styles.back}>← Projects</Link>
        <h1 className={styles.title}>{project.name}</h1>
      </div>
      {error && <div className={styles.errorBanner}>{error}</div>}
      {canManage && (
        <form onSubmit={handleCreateTask} className={styles.createForm}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title"
            required
            className={styles.input}
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className={styles.textarea}
          />
          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className={styles.input}
            title="Due date"
          />
          <select
            value={newAssignedTo}
            onChange={(e) => setNewAssignedTo(e.target.value)}
            className={styles.select}
            title="Assigned to"
          >
            <option value="">Assigned to (optional)</option>
            {tenantUsers.map((u) => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
          <button type="submit" disabled={creating} className={styles.btn}>
            {creating ? "Adding…" : "Add task"}
          </button>
        </form>
      )}
      <ul className={styles.taskList}>
        {taskList.length === 0 ? (
          <li className={styles.empty}>No tasks in this project.</li>
        ) : (
          taskList.map((t) => (
            <TaskCard
              key={t._id}
              task={t}
              currentUser={user}
              tenantUsers={tenantUsers}
              showProjectLink={false}
              onRefresh={loadTasks}
            />
          ))
        )}
      </ul>
    </div>
  );
}
