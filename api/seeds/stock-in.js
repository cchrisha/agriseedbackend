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

    const { name, block, lot, quantity } = req.body;

    if (!name || !block || !lot || !quantity) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    // 🔍 Seed must already exist (created via Create Seed)
    const seed = await Seed.findOne({ name });
    if (!seed) {
      return res.status(404).json({
        message: "Seed does not exist. Create seed first.",
      });
    }

    const batch = generateBatch();

    // 🔍 Find existing stock row
    let stock = await SeedStock.findOne({
      seed: seed._id,
      block,
      lot,
      batch,
    });

    if (stock) {
      stock.quantity += qty;
      await stock.save();
    } else {
      stock = await SeedStock.create({
        seed: seed._id,
        block,
        lot,
        batch,
        quantity: qty,
      });
    }

    return res.status(201).json({
      message: "Seedlings added successfully",
      stock,
    });
  } catch (err) {
    console.error("STOCK IN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
