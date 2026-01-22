import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";
import SeedTransaction from "../../models/SeedTransaction.js";

function generateBatch() {
  const m = new Date().getMonth() + 1;
  return `B${String(m).padStart(2, "0")}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { name, block, lot, quantity } = req.body;
    if (!name || !block || !lot || !quantity) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const seed = await Seed.findOne({ name });
    if (!seed) {
      return res.status(404).json({ message: "Seed not found" });
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const batch = generateBatch();

    // 🔍 HANAPIN ANG HULING SERIAL NUMBER
    const lastStock = await SeedStock.findOne({
      seed: seed._id,
    }).sort({ endNo: -1 });

    const startNo = lastStock ? lastStock.endNo + 1 : 1;
    const endNo = startNo + qty - 1;

    // 🆕 CREATE STOCK ENTRY
    const stock = await SeedStock.create({
      seed: seed._id,
      block,
      lot,
      batch,
      quantity: qty,
      startNo,
      endNo,
    });

    // 🧾 LOG TRANSACTION
    await SeedTransaction.create({
      seed: seed._id,
      type: "STOCK_IN",
      quantity: qty,
      batch,
      startNo,
      endNo,
    });

    return res.status(201).json({
      message: "Seed stock added successfully",
      stock,
    });
  } catch (err) {
    console.error("STOCK IN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
