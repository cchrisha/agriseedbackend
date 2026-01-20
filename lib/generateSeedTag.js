import SeedTransaction from "../models/SeedTransaction.js";

export async function generateSeedTag({
  seedName,
  date,
  block,
  lot,
}) {
  // 1️⃣ 3-letter code
  const code = seedName.substring(0, 3).toUpperCase();

  // 2️⃣ Month + Year
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  // 3️⃣ Count existing transactions this month
  const prefix = `${code}-${month}-${year}`;

  const count = await SeedTransaction.countDocuments({
    tag: { $regex: `^${prefix}` },
  });

  const running = count + 1;

  // 4️⃣ Block-Lot tag
  const blockTag = String.fromCharCode(64 + block); // 1=A, 2=B, 3=C
  const lotTag = lot;

  return `${prefix}-${running}(${blockTag}${lotTag})`;
}
