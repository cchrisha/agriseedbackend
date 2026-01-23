import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";
import SeedTransaction from "../../models/SeedTransaction.js";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    await dbConnect();

    const { name, quantity, reason } = req.body;
    if (!name || !quantity)
      return res.status(400).json({ message: "Missing fields" });

    const qty = Number(quantity);
    if (qty <= 0)
      return res.status(400).json({ message: "Invalid quantity" });

    const seed = await Seed.findOne({ name });
    if (!seed)
      return res.status(404).json({ message: "Seed not found" });

    const stocks = await SeedStock.find({
      seed: seed._id,
      quantity: { $gt: 0 },
    }).sort({ startNo: 1 });

    let remaining = qty;
    for (const s of stocks) {
      if (remaining <= 0) break;
      const deduct = Math.min(s.quantity, remaining);
      s.quantity -= deduct;
      remaining -= deduct;
      await s.save();
    }

    await SeedTransaction.create({
      seed: seed._id,
      type: "MORTALITY",
      quantity: qty,
      note: reason || "Mortality",
    });

    res.json({ message: "Mortality recorded" });
  } catch (err) {
    console.error("MORTALITY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}
