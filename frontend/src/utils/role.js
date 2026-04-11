/**
 * Normalize role for comparison (backend uses ADMIN/MANAGER/MEMBER).
 * Use this so checks work even if API returns lowercase or mixed case.
 */
export function getRole(user) {
  const r = user?.role ?? user?.Role ?? "";
  return typeof r === "string" ? r.toUpperCase() : "";
}

export function isAdmin(user) {
  return getRole(user) === "ADMIN";
}

export function canManageTasks(user) {
  return ["ADMIN", "MANAGER"].includes(getRole(user));
}

export function canCreateProjects(user) {
  return getRole(user) === "ADMIN";
}

export function canAddUsers(user) {
  return getRole(user) === "ADMIN";
}
