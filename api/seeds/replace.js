import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";
import SeedTransaction from "../../models/SeedTransaction.js";

function generateBatch() {
  const m = new Date().getMonth() + 1;
  return `B${String(m).padStart(2, "0")}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    await dbConnect();

    const { name, quantity } = req.body;
    if (!name || !quantity)
      return res.status(400).json({ message: "Missing fields" });

    const seed = await Seed.findOne({ name });
    if (!seed)
      return res.status(404).json({ message: "Seed not found" });

    const qty = Number(quantity);
    const batch = generateBatch();

    let stock = await SeedStock.findOne({
      seed: seed._id,
      block: "DEFAULT",
      lot: "DEFAULT",
      batch,
    });

    if (!stock) {
      stock = await SeedStock.create({
        seed: seed._id,
        block: "DEFAULT",
        lot: "DEFAULT",
        batch,
        quantity: qty,
      });
    } else {
      stock.quantity += qty;
      await stock.save();
    }

    await SeedTransaction.create({
      seed: seed._id,
      type: "REPLACE",
      quantity: qty,
      batch,
    });

    res.json({ message: "Replacement added", stock });
  } catch (err) {
    console.error("REPLACE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}
