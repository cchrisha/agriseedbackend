export function allow(user, role) {
  if (user.role !== role) {
    throw new Error("Forbidden");
  }
}
