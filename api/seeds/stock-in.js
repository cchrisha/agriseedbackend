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

    const { name, block, lot, quantity } = req.body;
    if (!name || !block || !lot || !quantity)
      return res.status(400).json({ message: "Missing fields" });

    const qty = Number(quantity);
    if (qty <= 0)
      return res.status(400).json({ message: "Invalid quantity" });

    const seed = await Seed.findOne({ name });
    if (!seed)
      return res.status(404).json({ message: "Seed not found" });

    // ❌ DO NOT ALLOW DUPLICATE BLOCK+LOT
    const exists = await SeedStock.findOne({
      seed: seed._id,
      block,
      lot,
    });

    if (exists)
      return res.status(400).json({
        message: "This block and lot already contains this seed",
      });

    const batch = generateBatch();

    // SERIAL CONTINUITY
    const last = await SeedStock.findOne({ seed: seed._id }).sort({ endNo: -1 });
    const startNo = last ? last.endNo + 1 : 1;
    const endNo = startNo + qty - 1;

    const stock = await SeedStock.create({
      seed: seed._id,
      block,
      lot,
      batch,
      quantity: qty,
      startNo,
      endNo,
    });

    await SeedTransaction.create({
      seed: seed._id,
      type: "STOCK_IN",
      quantity: qty,
      batch,
      startNo,
      endNo,
    });

    res.status(201).json({ message: "Stock added", stock });
  } catch (err) {
    console.error("STOCK IN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}
