import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";
import ActivityLog from "../../models/ActivityLog.js";
import Lot from "../../models/Lot.js";

export default async function handler(req, res) {

  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {

    await dbConnect();

    const { seedId, action, block, lot, quantity } = req.body;

    if (!seedId || !action)
      return res.status(400).json({ message: "Invalid input" });

    const seed = await Seed.findById(seedId);
    if (!seed) return res.status(404).json({ message: "Seed not found" });

    const user = req.headers.user || "System";
    const role = req.headers.role || "admin";

    // =====================================================
    // 🌱 STOCK-IN (GLOBAL)
    // =====================================================

    if (action === "STOCK-IN") {

      const qty = Number(quantity);

      if (!qty || qty <= 0)
        return res.status(400).json({ message: "Invalid quantity" });

      const stocks = [];

      for (let i = 0; i < qty; i++) {
        stocks.push({
          seed: seedId,
          status: "STOCK-IN",
        });
      }

      await SeedStock.insertMany(stocks);

      await ActivityLog.create({
        user,
        role,
        seed: seed._id,
        seedName: seed.name,
        seedTag: seed.tag,
        quantity: qty,
        process: "STOCK-IN",
      });

      return res.json({ message: "Stock added successfully" });
    }

    // =====================================================
    // 🧩 ASSIGN SEED TO LOT
    // =====================================================

    if (action === "ASSIGN-LOT") {

      if (block == null || lot == null)
        return res.status(400).json({ message: "Block & Lot required" });

      const existingLot = await Lot.findOne({
        block: Number(block),
        lot: Number(lot),
      });

      if (existingLot?.seed)
        return res.status(400).json({ message: "Lot already planted" });

      const planted = await Lot.findOneAndUpdate(
        {
          block: Number(block),
          lot: Number(lot),
        },
        {
          seed: seedId,
          available: 0,
          distributed: 0,
          mortality: 0,
          replaced: 0,
          stocks: 0,
        },
        {
          upsert: true,
          new: true,
        }
      );

      await ActivityLog.create({
        user,
        role,
        seed: seed._id,
        seedName: seed.name,
        seedTag: seed.tag,
        quantity: 0,
        process: "PLANTED",
      });

      return res.json({
        message: "Seed planted successfully",
        data: planted,
      });
    }

    return res.status(400).json({ message: "Unknown action" });

  } catch (err) {
    console.error("STOCK ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}
