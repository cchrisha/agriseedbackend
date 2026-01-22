import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";

// 🔹 Auto batch based on month
function generateBatch() {
  const month = new Date().getMonth() + 1; // 1–12
  return `B${String(month).padStart(2, "0")}`;
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

    // 🔍 Find seed
    const seed = await Seed.findOne({ name });
    if (!seed) {
      return res.status(404).json({ message: "Seed not found" });
    }

    const batch = generateBatch();

    // 🔍 Get ALL stocks for this seed & batch (ignore block & lot)
    const stocks = await SeedStock.find({
      seed: seed._id,
      batch,
    }).sort({ createdAt: 1 }); // FIFO

    if (!stocks.length) {
      return res.status(400).json({
        message: "No stock available",
      });
    }

    // 🔢 Compute total available quantity
    const totalQty = stocks.reduce(
      (sum, s) => sum + s.quantity,
      0
    );

    if (totalQty < qty) {
      return res.status(400).json({
        message: "Insufficient stock",
        available: totalQty,
      });
    }

    // 🔻 Deduct quantity (FIFO)
    let remaining = qty;

    for (const stock of stocks) {
      if (remaining <= 0) break;

      const deduct = Math.min(stock.quantity, remaining);
      stock.quantity -= deduct;
      remaining -= deduct;

      await stock.save();
    }

    return res.status(200).json({
      message: "Distributed successfully",
      seed: seed.name,
      batch,
      distributed: qty,
      remaining: totalQty - qty,
    });
  } catch (err) {
    console.error("DISTRIBUTE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
