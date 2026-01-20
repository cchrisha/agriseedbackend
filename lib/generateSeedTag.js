import SeedTransaction from "../models/SeedTransaction.js";

export async function generateSeedTag({ name, datePlanted }) {
  // 1️⃣ 3-letter seed code
  const code = name.substring(0, 3).toUpperCase();

  // 2️⃣ Month & Year
  const d = new Date(datePlanted);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  // 3️⃣ Prefix
  const prefix = `${code}-${month}-${year}`;

  // 4️⃣ Count existing batches
  const count = await SeedTransaction.countDocuments({
    tag: { $regex: `^${prefix}-` },
  });

  // 5️⃣ Running number
  return `${prefix}-${count + 1}`;
}
