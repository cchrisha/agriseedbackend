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

  const { seedId, quantity, action, block, lot } = req.body;
  const qty = Number(quantity || 0);

  const role = req.headers.role || "admin";
  const user = req.headers.user || "System";

  if (!seedId || !action)
    return res.status(400).json({ message: "Invalid input" });

  const seed = await Seed.findById(seedId);
  if (!seed) return res.status(404).json({ message: "Seed not found" });

  // ==================================================
  // 🧩 ASSIGN SEED TO LOT (UI BUTTON FLOW)
  // ==================================================
  if (action === "ASSIGN-LOT") {

    if(block == null || lot == null)
      return res.status(400).json({ message: "Block & Lot required" });

    const result = await Lot.findOneAndUpdate(
      { block:Number(block), lot:Number(lot) },
      { seed: seedId },
      { upsert:true, new:true }
    );

    return res.json({ message:"Seed assigned to lot", data: result });
  }

  // ==================================================
  // 🌱 STOCK-IN
  // ==================================================
  if (action === "STOCK-IN") {

    if(!qty || qty <= 0)
      return res.status(400).json({ message:"Invalid quantity" });

    const last = await SeedStock.findOne({ seed: seedId }).sort({ stockNo:-1 });
    const start = last ? last.stockNo + 1 : 1;

    const stocks = [];

    for (let i = 0; i < qty; i++) {
      stocks.push({
        seed: seedId,
        stockNo: start + i,
        tag: `${seed.tag}-${start + i}`,
        status: "STOCK-IN",
      });
    }

    await SeedStock.insertMany(stocks);

    await ActivityLog.create({
      user, role,
      seed: seed._id,
      seedName: seed.name,
      seedTag: seed.tag,
      quantity: qty,
      process: "STOCK-IN",
    });

    return res.json({ message: "Stock added" });
  }

  // ==================================================
  // 📦 AVAILABLE
  // ==================================================
  if (action === "AVAILABLE") {

    if (block == null || lot == null || !qty)
      return res.status(400).json({ message:"Missing fields" });

    const affected = await SeedStock.find({
      seed: seedId,
      status: "STOCK-IN",
    }).sort({ stockNo:1 }).limit(qty);

    if (affected.length < qty)
      return res.status(400).json({ message:"Not enough stock" });

    await SeedStock.updateMany(
      { _id:{ $in: affected.map(s=>s._id) } },
      { $set:{ status:"AVAILABLE", block:Number(block), lot:Number(lot) } }
    );

    await ActivityLog.create({
      user, role,
      seed: seed._id,
      seedName: seed.name,
      seedTag: seed.tag,
      quantity: qty,
      process: "AVAILABLE",
    });

    return res.json({ message:"Added to available" });
  }

  // ==================================================
  // 📤 STOCK-OUT
  // ==================================================
  if (action === "STOCK-OUT") {

    const affected = await SeedStock.find({
      seed: seedId,
      status: "AVAILABLE",
    }).limit(qty);

    if (affected.length < qty)
      return res.status(400).json({ message:"Not enough available" });

    await SeedStock.updateMany(
      { _id:{ $in: affected.map(s=>s._id) } },
      { $set:{ status:"STOCK-OUT" } }
    );

    return res.json({ message:"Distributed" });
  }

  // ==================================================
  // ☠ MORTALITY
  // ==================================================
  if (action === "MORTALITY") {

    const affected = await SeedStock.find({
      seed: seedId,
      status: "AVAILABLE",
    }).limit(qty);

    if (affected.length < qty)
      return res.status(400).json({ message:"Not enough available" });

    await SeedStock.updateMany(
      { _id:{ $in: affected.map(s=>s._id) } },
      { $set:{ status:"MORTALITY" } }
    );

    return res.json({ message:"Marked mortality" });
  }

  // ==================================================
  // 🔁 REPLACED
  // ==================================================
  if (action === "REPLACED") {

    const affected = await SeedStock.find({
      seed: seedId,
      status: "AVAILABLE",
    }).limit(qty);

    if (affected.length < qty)
      return res.status(400).json({ message:"Not enough available" });

    await SeedStock.updateMany(
      { _id:{ $in: affected.map(s=>s._id) } },
      { $set:{ status:"REPLACED" } }
    );

    return res.json({ message:"Replaced" });
  }

  return res.status(400).json({ message:"Unknown action" });

 } catch (err) {
  console.error(err);
  return res.status(500).json({ message: err.message });
 }
}
