export function allow(user, role) {
  if (!user || user.role !== role) {
    return false;
  }
  return true;
}
