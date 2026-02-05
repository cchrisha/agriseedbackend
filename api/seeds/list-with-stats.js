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
    // ACTIVE SEEDS
    // ===============================

    const seeds = await Seed.find({
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    });

    // ===============================
    // LOTS + SEED INFO
    // ===============================

    const lots = await Lot.find().populate("seed");

    // ===============================
    // PER LOT STATS
    // available = AVAILABLE + REPLACED
    // ===============================

    const lotStats = await SeedStock.aggregate([
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
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$status", "AVAILABLE"] },
                    { $eq: ["$status", "REPLACED"] },
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
    ]);

    // ===============================
    // GLOBAL WAREHOUSE STOCKS (STOCK-IN)
    // ===============================

    const warehouse = await SeedStock.aggregate([
      {
        $match: { status: "STOCK-IN" },
      },
      {
        $group: {
          _id: "$seed",
          stocks: { $sum: 1 },
        },
      },
    ]);

    // ===============================
    // MERGE EVERYTHING
    // ===============================

    const mergedLots = lots.map(l => {

      const stat = lotStats.find(
        s =>
          String(s._id.seed) === String(l.seed?._id) &&
          s._id.block === l.block &&
          s._id.lot === l.lot
      );

      const stock = warehouse.find(
        w => String(w._id) === String(l.seed?._id)
      );

      return {
        _id: l._id,
        block: l.block,
        lot: l.lot,
        seed: l.seed,

        // PER LOT
        available: stat?.available || 0,
        distributed: stat?.distributed || 0,
        mortality: stat?.mortality || 0,
        replaced: stat?.replaced || 0,

        // GLOBAL
        stocks: stock?.stocks || 0,
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
