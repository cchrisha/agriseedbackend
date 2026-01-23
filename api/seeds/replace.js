import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";
import SeedTransaction from "../../models/SeedTransaction.js";

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

    const stock = await SeedStock.findOne({
      seed: seed._id,
      block,
      lot,
    });

    if (!stock)
      return res.status(400).json({
        message: "Cannot replace. Block and lot does not exist for this seed",
      });

    stock.quantity += qty;
    await stock.save();

    await SeedTransaction.create({
      seed: seed._id,
      type: "REPLACE",
      quantity: qty,
    });

    res.json({ message: "Replacement added", stock });
  } catch (err) {
    console.error("REPLACE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}
