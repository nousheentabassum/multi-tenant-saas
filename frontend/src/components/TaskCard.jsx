import { useState } from "react";
import { Link } from "react-router-dom";
import { tasks as tasksApi } from "../api/client";
import { canManageTasks, isAdmin } from "../utils/role";
import styles from "./TaskCard.module.css";

function formatDue(d) {
  if (!d) return null;
  const date = new Date(d);
  const now = new Date();
  if (date < now) return { text: "Overdue", overdue: true };
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === now.toDateString()) return { text: "Today", overdue: false };
  if (date.toDateString() === tomorrow.toDateString()) return { text: "Tomorrow", overdue: false };
  return { text: date.toLocaleDateString(), overdue: false };
}

function toDateInputValue(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toISOString().slice(0, 10);
}

export default function TaskCard({
  task,
  currentUser,
  tenantUsers = [],
  showProjectLink = true,
  onRefresh,
}) {
  const [editing, setEditing] = useState(false);
  const getInitialEditForm = () => ({
    title: task.title,
    description: task.description || "",
    dueDate: toDateInputValue(task.dueDate),
    assignedTo: task.assignedTo?._id || task.assignedTo || "",
  });
  const [editForm, setEditForm] = useState(getInitialEditForm);
  const [saving, setSaving] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const canEdit = canManageTasks(currentUser);
  const canDelete = isAdmin(currentUser);
  const canComment = true; // all authenticated users

  const due = formatDue(task.dueDate);
  const comments = task.comments || [];
  const assignedToName = task.assignedTo?.name || "Unassigned";
  const createdByName = task.createdBy?.name || "—";

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: editForm.title.trim(),
      description: editForm.description.trim() || undefined,
      dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
      assignedTo: editForm.assignedTo || null,
    };
    tasksApi
      .update(task._id, payload)
      .then(() => {
        setEditing(false);
        onRefresh?.();
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    if (!canDelete || !confirm("Delete this task?")) return;
    tasksApi
      .delete(task._id)
      .then(() => onRefresh?.())
      .catch(() => {});
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    tasksApi
      .addComment(task._id, newComment.trim())
      .then(() => {
        setNewComment("");
        onRefresh?.();
      })
      .catch(() => {})
      .finally(() => setSubmittingComment(false));
  };

  return (
    <li className={styles.card}>
      {!editing ? (
        <>
          <div className={styles.body}>
            <span className={styles.taskTitle}>{task.title}</span>
            {task.description && (
              <span className={styles.taskDesc}>{task.description}</span>
            )}
            {showProjectLink && task.projectId?.name && (
              <Link to={`/projects/${task.projectId._id}`} className={styles.projectLink}>
                {task.projectId.name}
              </Link>
            )}
            <div className={styles.meta}>
              {due && (
                <span className={due.overdue ? styles.dueOverdue : styles.due}>
                  Due: {due.text}
                </span>
              )}
              <span className={styles.metaItem}>Assigned to: {assignedToName}</span>
              <span className={styles.metaItem}>Created by: {createdByName}</span>
            </div>
          </div>
          <div className={styles.actions}>
            <select
              value={task.status}
              onChange={(e) =>
                tasksApi.update(task._id, { status: e.target.value }).then(() => onRefresh?.())
              }
              disabled={!canEdit}
              className={styles.statusSelect}
            >
              <option value="TODO">To do</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="DONE">Done</option>
            </select>
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setEditForm(getInitialEditForm());
                  setEditing(true);
                }}
                className={styles.editBtn}
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button type="button" onClick={handleDelete} className={styles.deleteBtn}>
                Delete
              </button>
            )}
            {canComment && (
              <button
                type="button"
                onClick={() => setShowComment(!showComment)}
                className={styles.commentBtn}
              >
                Comment {comments.length ? `(${comments.length})` : ""}
              </button>
            )}
          </div>
        </>
      ) : (
        <form onSubmit={handleSaveEdit} className={styles.editForm}>
          <input
            type="text"
            value={editForm.title}
            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Title"
            required
            className={styles.input}
          />
          <textarea
            value={editForm.description}
            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description"
            rows={2}
            className={styles.textarea}
          />
          <div className={styles.editRow}>
            <label className={styles.label}>
              Due date
              <input
                type="date"
                value={editForm.dueDate}
                onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))}
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              Assigned to
              <select
                value={editForm.assignedTo}
                onChange={(e) => setEditForm((f) => ({ ...f, assignedTo: e.target.value }))}
                className={styles.select}
              >
                <option value="">Unassigned</option>
                {tenantUsers.map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.editActions}>
            <button type="submit" disabled={saving} className={styles.saveBtn}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {canComment && showComment && (
        <div className={styles.commentSection}>
          <form onSubmit={handleAddComment} className={styles.commentForm}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment…"
              className={styles.commentInput}
            />
            <button type="submit" disabled={submittingComment} className={styles.commentSubmit}>
              {submittingComment ? "…" : "Post"}
            </button>
          </form>
          <ul className={styles.commentList}>
            {comments.length === 0 ? (
              <li className={styles.commentEmpty}>No comments yet.</li>
            ) : (
              comments.map((c, i) => (
                <li key={i} className={styles.commentItem}>
                  <span className={styles.commentUser}>{c.user?.name ?? "—"}:</span>{" "}
                  {c.text}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </li>
  );
}
