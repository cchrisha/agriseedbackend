// import dbConnect from "../../lib/db.js";
// import Seed from "../../models/Seed.js";
// import SeedStock from "../../models/SeedStock.js";
// import ActivityLog from "../../models/ActivityLog.js";
// import Lot from "../../models/Lot.js";

// export default async function handler(req, res) {

//  if (req.method !== "POST")
//   return res.status(405).json({ message: "Method not allowed" });

//  try {

//   await dbConnect();

//   const { seedId, quantity, action, block, lot } = req.body;
//   const qty = Number(quantity || 0);

//   const role = req.headers.role || "admin";
//   const user = req.headers.user || "System";

//   if (!seedId || !action)
//     return res.status(400).json({ message: "Invalid input" });

//   const seed = await Seed.findById(seedId);
//   if (!seed) return res.status(404).json({ message: "Seed not found" });

//   // ==================================================
//   // 🧩 ASSIGN SEED TO LOT (UI BUTTON FLOW)
//   // ==================================================
//   if (action === "ASSIGN-LOT") {

//     if(block == null || lot == null)
//       return res.status(400).json({ message: "Block & Lot required" });

//     const result = await Lot.findOneAndUpdate(
//       { block:Number(block), lot:Number(lot) },
//       { seed: seedId },
//       { upsert:true, new:true }
//     );

//     return res.json({ message:"Seed assigned to lot", data: result });
//   }

//   // ==================================================
//   // 🌱 STOCK-IN
//   // ==================================================
//   if (action === "STOCK-IN") {

//     if(!qty || qty <= 0)
//       return res.status(400).json({ message:"Invalid quantity" });

//     const last = await SeedStock.findOne({ seed: seedId }).sort({ stockNo:-1 });
//     const start = last ? last.stockNo + 1 : 1;

//     const stocks = [];

//     for (let i = 0; i < qty; i++) {
//       stocks.push({
//         seed: seedId,
//         stockNo: start + i,
//         tag: `${seed.tag}-${start + i}`,
//         status: "STOCK-IN",
//       });
//     }

//     await SeedStock.insertMany(stocks);

//     await ActivityLog.create({
//       user, role,
//       seed: seed._id,
//       seedName: seed.name,
//       seedTag: seed.tag,
//       quantity: qty,
//       process: "STOCK-IN",
//     });

//     return res.json({ message: "Stock added" });
//   }

//   // ==================================================
//   // 📦 AVAILABLE
//   // ==================================================
//   if (action === "AVAILABLE") {

//     if (block == null || lot == null || !qty)
//       return res.status(400).json({ message:"Missing fields" });

//     const affected = await SeedStock.find({
//       seed: seedId,
//       status: "STOCK-IN",
//     }).sort({ stockNo:1 }).limit(qty);

//     if (affected.length < qty)
//       return res.status(400).json({ message:"Not enough stock" });

//     await SeedStock.updateMany(
//       { _id:{ $in: affected.map(s=>s._id) } },
//       { $set:{ status:"AVAILABLE", block:Number(block), lot:Number(lot) } }
//     );

//     await ActivityLog.create({
//       user, role,
//       seed: seed._id,
//       seedName: seed.name,
//       seedTag: seed.tag,
//       quantity: qty,
//       process: "AVAILABLE",
//     });

//     return res.json({ message:"Added to available" });
//   }

//   // ==================================================
//   // 📤 STOCK-OUT
//   // ==================================================
//   if (action === "STOCK-OUT") {

//     const affected = await SeedStock.find({
//       seed: seedId,
//       status: "AVAILABLE",
//     }).limit(qty);

//     if (affected.length < qty)
//       return res.status(400).json({ message:"Not enough available" });

//     await SeedStock.updateMany(
//       { _id:{ $in: affected.map(s=>s._id) } },
//       { $set:{ status:"STOCK-OUT" } }
//     );

//     return res.json({ message:"Distributed" });
//   }

//   // ==================================================
//   // ☠ MORTALITY
//   // ==================================================
//   if (action === "MORTALITY") {

//     const affected = await SeedStock.find({
//       seed: seedId,
//       status: "AVAILABLE",
//     }).limit(qty);

//     if (affected.length < qty)
//       return res.status(400).json({ message:"Not enough available" });

//     await SeedStock.updateMany(
//       { _id:{ $in: affected.map(s=>s._id) } },
//       { $set:{ status:"MORTALITY" } }
//     );

//     return res.json({ message:"Marked mortality" });
//   }

//   // ==================================================
//   // 🔁 REPLACED
//   // ==================================================
//   if (action === "REPLACED") {

//     const affected = await SeedStock.find({
//       seed: seedId,
//       status: "AVAILABLE",
//     }).limit(qty);

//     if (affected.length < qty)
//       return res.status(400).json({ message:"Not enough available" });

//     await SeedStock.updateMany(
//       { _id:{ $in: affected.map(s=>s._id) } },
//       { $set:{ status:"REPLACED" } }
//     );

//     return res.json({ message:"Replaced" });
//   }

//   return res.status(400).json({ message:"Unknown action" });

//  } catch (err) {
//   console.error(err);
//   return res.status(500).json({ message: err.message });
//  }
// }
import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";
import Lot from "../../models/Lot.js";

export default async function handler(req, res) {

  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  try {

    await dbConnect();

    // ===============================
    // ALL SEEDS
    // ===============================
    const seeds = await Seed.find({
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    });

    // ===============================
    // ALL LOTS + SEED INFO
    // ===============================
    const lots = await Lot.find().populate("seed");

    // ===============================
    // STOCK STATS (GLOBAL PER SEED)
    // ===============================
    const stats = await SeedStock.aggregate([

      {
        $group: {
          _id: "$seed",

          // TOTAL STOCK-IN (inventory)
          stocks: {
            $sum: {
              $cond: [{ $eq: ["$status", "STOCK-IN"] }, 1, 0],
            },
          },

          // AVAILABLE ONLY WHEN PLANTED
          available: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "AVAILABLE"] },
                    { $ne: ["$block", null] },
                    { $ne: ["$lot", null] },
                  ],
                },
                1,
                0,
              ],
            },
          },

          distributed: {
            $sum: { $cond: [{ $eq: ["$status", "STOCK-OUT"] }, 1, 0] },
          },

          mortality: {
            $sum: { $cond: [{ $eq: ["$status", "MORTALITY"] }, 1, 0] },
          },

          replaced: {
            $sum: { $cond: [{ $eq: ["$status", "REPLACED"] }, 1, 0] },
          },
        },
      },

      // JOIN SEED INFO
      {
        $lookup: {
          from: "seeds",
          localField: "_id",
          foreignField: "_id",
          as: "seed",
        },
      },

      { $unwind: "$seed" },

      {
        $project: {
          seedId: "$seed._id",
          name: "$seed.name",
          tag: "$seed.tag",
          stocks: 1,
          available: 1,
          distributed: 1,
          mortality: 1,
          replaced: 1,
        },
      },
    ]);

    // ===============================
    // MERGE LOT + STATS
    // ===============================
    const mergedLots = lots.map(l => {

      const stat = stats.find(
        s => String(s.seedId) === String(l.seed?._id)
      );

      return {
        _id: l._id,
        block: l.block,
        lot: l.lot,
        seed: l.seed,
        available: stat?.available || 0,
        distributed: stat?.distributed || 0,
        mortality: stat?.mortality || 0,
        replaced: stat?.replaced || 0,
        stocks: stat?.stocks || 0,
      };
    });

    return res.json({
      seeds,
      lots: mergedLots,
    });

  } catch (err) {
    console.error("MERGED ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}
