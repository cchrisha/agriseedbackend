import Seed from "../models/Seed.js";

export async function generateSeedTag({ name, datePlanted, address }) {
  // 1️⃣ 3-letter seed code
  const code = name.substring(0, 3).toUpperCase();

  // 2️⃣ Month & Year
  const d = new Date(datePlanted);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  // 3️⃣ Prefix
  const prefix = `${code}-${month}-${year}`;

  // 4️⃣ Count existing seeds this month
  const count = await Seed.countDocuments({
    tag: { $regex: `^${prefix}` },
  });

  const running = count + 1;

  // 5️⃣ Address tag (PK, BL1, etc.)
  const addr = address.replace(/\s+/g, "").toUpperCase();

  return `${prefix}-${running}(${addr})`;
}
