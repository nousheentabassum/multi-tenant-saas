const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getToken() {
  return localStorage.getItem("token");
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

export const auth = {
  login: (email, password) =>
    api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (body) =>
    api("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  registerUser: (body) =>
    api("/api/auth/register-user", { method: "POST", body: JSON.stringify(body) }),
  refresh: (refreshToken) =>
    api("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
};

export const projects = {
  list: () => api("/api/projects"),
  create: (name) =>
    api("/api/projects", { method: "POST", body: JSON.stringify({ name }) }),
};

export const tasks = {
  list: (params) => {
    const q = new URLSearchParams(params).toString();
    return api(`/api/tasks${q ? `?${q}` : ""}`);
  },
  create: (body) =>
    api("/api/tasks", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) =>
    api(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id) => api(`/api/tasks/${id}`, { method: "DELETE" }),
  analytics: () => api("/api/tasks/analytics"),
  addComment: (id, text) =>
    api(`/api/tasks/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
};

export const users = {
  me: () => api("/api/users/me"),
  tenant: () => api("/api/users/tenant"),
  add: (body) =>
    api("/api/users", { method: "POST", body: JSON.stringify(body) }),
};

export const audit = {
  list: () => api("/api/auditlogs"),
};
