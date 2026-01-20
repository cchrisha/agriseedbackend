export async function generateSeedTag({
  name,
  datePlanted,
  primaryKey,
}) {
  // 1️⃣ 3-letter seed code
  const code = name.substring(0, 3).toUpperCase();

  // 2️⃣ Month & Year
  const d = new Date(datePlanted);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  // 3️⃣ Short primary key (last 6 chars)
  const pk = primaryKey.slice(-6).toUpperCase();

  // FINAL FORMAT
  // CAC-01-2026-3FA9C2
  return `${code}-${month}-${year}-${pk}`;
}
