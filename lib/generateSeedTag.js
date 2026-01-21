import SeedTransaction from "../models/SeedTransaction.js";

export async function generateSeedTag({ name, datePlanted }) {

  const code = name.substring(0, 3).toUpperCase();

  const d = new Date(datePlanted);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  const prefix = `${code}-${month}-${year}`;

  const count = await SeedTransaction.countDocuments({
    tag: { $regex: `^${prefix}-` },
  });

  return `${prefix}-${count + 1}`;
}
