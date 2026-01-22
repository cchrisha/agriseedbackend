import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { name, block, lot, batch, quantity } = req.body;

    if (!name || !block || !lot || !batch || !quantity) {
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

    const stock = await SeedStock.findOne({
      seed: seed._id,
      block,
      lot,
      batch,
    });

    if (!stock || stock.quantity < qty) {
      return res
        .status(400)
        .json({ message: "Insufficient stock" });
    }

    stock.quantity -= qty;
    await stock.save();

    res.status(200).json({
      message: "Distributed successfully",
      stock,
    });
  } catch (err) {
    console.error("DISTRIBUTE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}
