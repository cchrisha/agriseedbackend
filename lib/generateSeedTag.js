import Seed from "../models/Seed.js";

export async function generateSeedTag({
  name,
  datePlanted,
}) {
  // 1️⃣ 3-letter seed code
  const code = name.substring(0, 3).toUpperCase();

  // 2️⃣ Month & Year
  const d = new Date(datePlanted);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  // 3️⃣ Prefix (CAC-01-2026)
  const prefix = `${code}-${month}-${year}`;

  // 4️⃣ Count existing seeds with same prefix
  const count = await Seed.countDocuments({
    tag: { $regex: `^${prefix}-` },
  });

  // 5️⃣ Running number (1,2,3...)
  const runningNumber = count + 1;

  // ✅ FINAL TAG
  return `${prefix}-${runningNumber}`;
}
