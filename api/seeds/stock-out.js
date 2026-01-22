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

    const { name, quantity } = req.body;
    if (!name || !quantity) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const seed = await Seed.findOne({ name });
    if (!seed) {
      return res.status(404).json({ message: "Seed not found" });
    }

    const batch = generateBatch();

    // FIFO: oldest stock first
    const stocks = await SeedStock.find({
      seed: seed._id,
      batch,
      quantity: { $gt: 0 },
    }).sort({ createdAt: 1 });

    const total = stocks.reduce((sum, s) => sum + s.quantity, 0);
    if (total < qty) {
      return res.status(400).json({
        message: "Insufficient stock",
        available: total,
      });
    }

    let remaining = qty;

    for (const stock of stocks) {
      if (remaining <= 0) break;

      const deduct = Math.min(stock.quantity, remaining);
      stock.quantity -= deduct;
      remaining -= deduct;
      await stock.save();
    }

    await SeedTransaction.create({
      seed: seed._id,
      type: "DISTRIBUTE",
      quantity: qty,
      batch,
    });

    res.json({
      message: "Distributed successfully",
      distributed: qty,
      remaining: total - qty,
    });
  } catch (err) {
    console.error("DISTRIBUTE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}
