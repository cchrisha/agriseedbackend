export function generateSeedTag({ name, datePlanted, primaryKey }) {
  if (!name || !datePlanted || !primaryKey) {
    throw new Error("Missing parameters for seed tag generation");
  }

  // 1️⃣ First 3 letters of seed name
  const code = name.trim().substring(0, 3).toUpperCase();

  // 2️⃣ Month & Year
  const date = new Date(datePlanted);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  // 3️⃣ Final tag format
  return `${code}-${month}-${year}-(${primaryKey})`;
}