import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import ActivityLog from "../../models/ActivityLog.js";
import Lot from "../../models/Lot.js";

export default async function handler(req, res) {

  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {

    await dbConnect();

    const { seedId, action, block, lot } = req.body;

    if (!seedId || action !== "ASSIGN-LOT")
      return res.status(400).json({ message: "Invalid input" });

    if (block == null || lot == null)
      return res.status(400).json({ message: "Block & Lot required" });

    const seed = await Seed.findById(seedId);
    if (!seed) return res.status(404).json({ message: "Seed not found" });

    // =====================================
    // CHECK IF LOT ALREADY HAS SEED
    // =====================================

    const existingLot = await Lot.findOne({
      block: Number(block),
      lot: Number(lot),
    });

    if (existingLot?.seed)
      return res.status(400).json({
        message: "Lot already planted"
      });

    // =====================================
    // CREATE / ASSIGN LOT (CLEAN)
    // =====================================

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

    // =====================================
    // ACTIVITY LOG
    // =====================================

    await ActivityLog.create({
      user: req.headers.user || "System",
      role: req.headers.role || "admin",
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

  } catch (err) {
    console.error("PLANT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}
