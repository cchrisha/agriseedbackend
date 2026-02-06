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
    // 🌱 STOCK-IN (WAREHOUSE)
    // =====================================================

    if (action === "STOCK-IN") {

      const qty = Number(quantity);
      if (!qty || qty <= 0)
        return res.status(400).json({ message: "Invalid quantity" });

      const docs = [];
      for (let i = 0; i < qty; i++) docs.push({ seed: seedId, status: "STOCK-IN" });

      await SeedStock.insertMany(docs);

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

    // =====================================================
    // 🧩 ASSIGN LOT (PLANT)
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
        { seed: seedId },
        { upsert:true, new:true }
      );

      await ActivityLog.create({
        user, role,
        seed: seed._id,
        seedName: seed.name,
        seedTag: seed.tag,
        quantity: 0,
        process: "PLANTED",
      });

      return res.json({ message:"Seed planted", data: planted });
    }

    // =====================================================
    // 🌿 AVAILABLE (WAREHOUSE → LOT)
    // =====================================================

    if (action === "AVAILABLE") {

      const qty = Number(quantity);
      if (!qty || block == null || lot == null)
        return res.status(400).json({ message: "Missing fields" });

      const plantedLot = await Lot.findOne({
        block: Number(block),
        lot: Number(lot),
        seed: seedId,
      });

      if (!plantedLot)
        return res.status(400).json({ message: "Seed not planted in this lot" });

      const warehouse = await SeedStock.find({
        seed: seedId,
        status: "STOCK-IN",
      }).limit(qty);

      if (warehouse.length < qty)
        return res.status(400).json({ message: "Not enough stock" });

      // tag parts
      const d = new Date(seed.datePlanted);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const batch = `B${month}`;

      const last = await SeedStock.findOne({
        seed: seedId,
        stockNo: { $exists: true },
      }).sort({ stockNo: -1 });

      let start = last ? last.stockNo + 1 : 1;

      for (const s of warehouse) {
        s.stockNo = start;
        s.tag = `${seed.tag}-${year}-${month}-${day}-${batch}-${start}`;
        s.status = "AVAILABLE";
        s.block = Number(block);
        s.lot = Number(lot);
        await s.save();
        start++;
      }

      await ActivityLog.create({
        user, role,
        seed: seed._id,
        seedName: seed.name,
        seedTag: seed.tag,
        quantity: qty,
        process: "AVAILABLE",
      });

      return res.json({ message: "Seedlings moved to lot" });
    }

    // =====================================================
    // 📦 DISTRIBUTE
    // =====================================================

    if (action === "DISTRIBUTE") {

      const qty = Number(quantity);

      const available = await SeedStock.find({
        seed: seedId,
        status:"AVAILABLE",
        block:Number(block),
        lot:Number(lot),
      }).limit(qty);

      if (available.length < qty)
        return res.status(400).json({ message:"Not enough available" });

      for (const s of available) {
        s.status = "STOCK-OUT";
        await s.save();
      }

      return res.json({ message:"Distributed" });
    }

    // =====================================================
    // ☠ MORTALITY
    // =====================================================

    // =====================================================
// ☠ MORTALITY (AVAILABLE → DEAD + DOCUMENTATION)
// =====================================================

if (action === "MORTALITY") {

  const qty = Number(quantity);

  const available = await SeedStock.find({
    seed: seedId,
    status: "AVAILABLE",
    block: Number(block),
    lot: Number(lot),
  }).limit(qty);

  if (available.length < qty)
    return res.status(400).json({ message: "Not enough available" });

  for (const s of available) {

    // physical change
    s.status = "MORTALITY";
    await s.save();

    // documentation record
    await SeedStock.create({
      seed: seedId,
      status: "MORTALITY",
      block: Number(block),
      lot: Number(lot),
    });
  }

  return res.json({ message: "Marked mortality" });
}


    // =====================================================
    // 🔁 REPLACED (WAREHOUSE → AVAILABLE + LOG)
    // =====================================================

    if (action === "REPLACED") {

      const qty = Number(quantity);

      const warehouse = await SeedStock.find({
        seed: seedId,
        status:"MORTALITY"
      }).limit(qty);

      if (warehouse.length < qty)
        return res.status(400).json({ message:"Not enough warehouse" });

      const last = await SeedStock.findOne({
        seed: seedId,
        stockNo:{ $exists:true }
      }).sort({ stockNo:-1 });

      let start = last ? last.stockNo + 1 : 1;

      for (const s of warehouse) {

        // physical replacement
        s.status = "AVAILABLE";
        s.block = Number(block);
        s.lot = Number(lot);
        s.stockNo = start;
        s.tag = `${seed.tag}-${start}`;
        await s.save();

        // documentation
        await SeedStock.create({
          seed: seedId,
          status:"REPLACED",
          block:Number(block),
          lot:Number(lot)
        });

        start++;
      }

      return res.json({ message:"Replaced successfully" });
    }

    return res.status(400).json({ message:"Unknown action" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}
