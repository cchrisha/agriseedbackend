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
  // 🌱 STOCK-IN (WAREHOUSE ONLY)
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
  // 🧩 ASSIGN SEED TO LOT (PLANT)
  // =====================================================

  if (action === "ASSIGN-LOT") {

    if (block == null || lot == null)
      return res.status(400).json({ message: "Block & Lot required" });

    const existing = await Lot.findOne({
      block:Number(block),
      lot:Number(lot),
    });

    if (existing?.seed)
      return res.status(400).json({ message:"Lot already planted" });

    const planted = await Lot.findOneAndUpdate(
      { block:Number(block), lot:Number(lot) },
      {
        seed: seedId,
        available: 0,
        distributed: 0,
        mortality: 0,
        replaced: 0,
        stocks: 0,
      },
      { upsert:true, new:true }
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

    return res.json({ message:"Seed planted", data: planted });
  }

  // =====================================================
  // 🌿 AVAILABLE (MOVE FROM WAREHOUSE → LOT)
  // =====================================================

  if (action === "AVAILABLE") {

    const qty = Number(quantity);

    if (!qty || block == null || lot == null)
      return res.status(400).json({ message:"Missing fields" });

    const plantedLot = await Lot.findOne({
      block:Number(block),
      lot:Number(lot),
      seed: seedId
    });

    if (!plantedLot)
      return res.status(400).json({ message:"Seed not planted in this lot" });

    const warehouse = await SeedStock.find({
      seed: seedId,
      status: "STOCK-IN"
    }).limit(qty);

    if (warehouse.length < qty)
      return res.status(400).json({ message:"Not enough stock" });

    const last = await SeedStock.findOne({
      seed: seedId,
      stockNo:{ $exists:true }
    }).sort({ stockNo:-1 });

    let start = last ? last.stockNo + 1 : 1;

    for (const s of warehouse) {

      s.stockNo = start;
      s.tag = `${seed.tag}-${start}`;
      s.status = "AVAILABLE";
      s.block = Number(block);
      s.lot = Number(lot);

      await s.save();
      start++;
    }

    await ActivityLog.create({
      user,
      role,
      seed: seed._id,
      seedName: seed.name,
      seedTag: seed.tag,
      quantity: qty,
      process: "AVAILABLE",
    });

    return res.json({ message:"Seedlings moved to lot" });
  }

  return res.status(400).json({ message:"Unknown action" });

 } catch (err) {
  console.error("STOCK ERROR:", err);
  return res.status(500).json({ message: err.message });
 }
}
