export function allow(user, roles) {
  if (!user) return false;

  if (typeof roles === "string") {
    return user.role === roles;
  }

  if (Array.isArray(roles)) {
    return roles.includes(user.role);
  }

  return false;
}
