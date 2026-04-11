import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { projects as projectsApi, tasks as tasksApi, users as usersApi } from "../api/client";
import { canManageTasks } from "../utils/role";
import TaskCard from "../components/TaskCard";
import styles from "./Tasks.module.css";

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [newTaskProjectId, setNewTaskProjectId] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const canManage = canManageTasks(user);

  const loadTasks = () => {
    const params = {};
    if (filterProject) params.projectId = filterProject;
    if (filterStatus) params.status = filterStatus;
    return tasksApi.list(params).then((d) => setTasks(d.tasks || []));
  };

  useEffect(() => {
    projectsApi.list().then((d) => setProjectList(d.projects || [])).catch(() => {});
    usersApi.tenant().then((d) => setTenantUsers(d.users || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    loadTasks()
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [filterProject, filterStatus]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((t) => (t.title || "").toLowerCase().includes(q));
  }, [tasks, searchQuery]);

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskProjectId || !canManage) return;
    setCreating(true);
    setCreateError("");
    const payload = {
      title: newTaskTitle.trim(),
      projectId: newTaskProjectId,
      description: newTaskDescription.trim() || undefined,
      dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
      assignedTo: newTaskAssignedTo || undefined,
    };
    tasksApi
      .create(payload)
      .then(() => {
        setNewTaskTitle("");
        setNewTaskProjectId("");
        setNewTaskDescription("");
        setNewTaskDueDate("");
        setNewTaskAssignedTo("");
        return loadTasks();
      })
      .catch((err) => setCreateError(err.message || "Failed to create task"))
      .finally(() => setCreating(false));
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Tasks</h1>
      {canManage && (
        <form onSubmit={handleCreateTask} className={styles.createForm}>
          <select
            value={newTaskProjectId}
            onChange={(e) => setNewTaskProjectId(e.target.value)}
            required
            className={styles.select}
          >
            <option value="">Select project</option>
            {projectList.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title"
            required
            className={styles.createInput}
          />
          <textarea
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className={styles.createTextarea}
          />
          <input
            type="date"
            value={newTaskDueDate}
            onChange={(e) => setNewTaskDueDate(e.target.value)}
            className={styles.createInput}
            title="Due date"
          />
          <select
            value={newTaskAssignedTo}
            onChange={(e) => setNewTaskAssignedTo(e.target.value)}
            className={styles.select}
            title="Assigned to"
          >
            <option value="">Assigned to (optional)</option>
            {tenantUsers.map((u) => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
          <button type="submit" disabled={creating} className={styles.createBtn}>
            {creating ? "Adding…" : "Add task"}
          </button>
        </form>
      )}
      {createError && <div className={styles.createError}>{createError}</div>}
      <div className={styles.filters}>
        <input
          type="search"
          placeholder="Search by title…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.search}
        />
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className={styles.select}
        >
          <option value="">All projects</option>
          {projectList.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={styles.select}
        >
          <option value="">All statuses</option>
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="DONE">Done</option>
        </select>
      </div>
      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : (
        <ul className={styles.list}>
          {filteredTasks.length === 0 ? (
            <li className={styles.empty}>
              {tasks.length === 0 ? "No tasks match the filters." : "No tasks match your search."}
            </li>
          ) : (
            filteredTasks.map((t) => (
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
      )}
    </div>
  );
}
