import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";
import ActivityLog from "../../models/ActivityLog.js";
import Lot from "../../models/Lot.js";

export default async function handler(req, res) {

  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  try {

    await dbConnect();

    // ===============================
    // ACTIVE SEEDS
    // ===============================

    const seeds = await Seed.find({
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    });

    // ===============================
    // LOTS
    // ===============================

    const lots = await Lot.find().populate("seed");

    // ===============================
    // PER LOT PHYSICAL COUNTS (SeedStock)
    // ===============================

    const stats = await SeedStock.aggregate([
      {
        $match: {
          block: { $ne: null },
          lot: { $ne: null },
        },
      },
      {
        $group: {
          _id: {
            seed: "$seed",
            block: "$block",
            lot: "$lot",
          },

          available: {
            $sum: { $cond: [{ $eq: ["$status", "AVAILABLE"] }, 1, 0] },
          },

          distributed: {
            $sum: { $cond: [{ $eq: ["$status", "STOCK-OUT"] }, 1, 0] },
          },

          mortality: {
            $sum: { $cond: [{ $eq: ["$status", "MORTALITY"] }, 1, 0] },
          },
        },
      },
    ]);

    // ===============================
    // REPLACED DOCUMENTATION (ActivityLog)
    // ===============================

    const replacedLogs = await ActivityLog.aggregate([
      {
        $match: { process: "REPLACED" },
      },
      {
        $group: {
          _id: {
            seed: "$seed",
            block: "$block",
            lot: "$lot",
          },
          total: { $sum: "$quantity" },
        },
      },
    ]);

    // ===============================
    // WAREHOUSE (STOCK-IN)
    // ===============================

    const warehouse = await SeedStock.aggregate([
      { $match: { status: "STOCK-IN" } },
      {
        $group: {
          _id: "$seed",
          stocks: { $sum: 1 },
        },
      },
    ]);

    // ===============================
    // FINAL MERGE
    // ===============================

    const mergedLots = lots.map(l => {

      const s = stats.find(
        x =>
          String(x._id.seed) === String(l.seed?._id) &&
          x._id.block === l.block &&
          x._id.lot === l.lot
      );

      const r = replacedLogs.find(
        x =>
          String(x._id.seed) === String(l.seed?._id) &&
          x._id.block === l.block &&
          x._id.lot === l.lot
      );

      const w = warehouse.find(
        x => String(x._id) === String(l.seed?._id)
      );

      return {
        _id: l._id,
        block: l.block,
        lot: l.lot,
        seed: l.seed,

        // REAL PLANTS
        available: s?.available || 0,
        mortality: s?.mortality || 0,
        distributed: s?.distributed || 0,

        // DOCUMENTATION ONLY
        replaced: r?.total || 0,

        // WAREHOUSE
        stocks: w?.stocks || 0,
      };
    });

    return res.json({
      seeds,
      lots: mergedLots,
    });

  } catch (err) {
    console.error("LIST ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}
