import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";

// 🔹 Auto batch based on month
function generateBatch() {
  const month = new Date().getMonth() + 1;
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

    const seed = await Seed.findOne({ name });
    if (!seed) {
      return res.status(404).json({ message: "Seed not found" });
    }

    // 🔒 SYSTEM DEFAULTS
    const block = "DEFAULT";
    const lot = "DEFAULT";
    const batch = generateBatch();

    const stock = await SeedStock.findOne({
      seed: seed._id,
      block,
      lot,
      batch,
    });

    if (!stock || stock.quantity < qty) {
      return res.status(400).json({
        message: "Insufficient stock",
      });
    }

    stock.quantity -= qty;
    await stock.save();

    return res.status(200).json({
      message: "Distributed successfully",
      batch,
      stock,
    });
  } catch (err) {
    console.error("DISTRIBUTE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
