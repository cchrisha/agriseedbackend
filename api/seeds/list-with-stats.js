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
    // LOTS
    // ===============================

    const lots = await Lot.find().populate("seed");

    // ===============================
    // AVAILABLE PER LOT
    // ===============================

    const availableStats = await SeedStock.aggregate([
      {
        $match: {
          status: "AVAILABLE",
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
          available: { $sum: 1 },
        },
      },
    ]);

    // ===============================
    // WAREHOUSE STOCKS (GLOBAL)
    // ===============================

    const stockStats = await SeedStock.aggregate([
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
    // MERGE LOTS + STATS
    // ===============================

    const mergedLots = lots.map(l => {
      const avail = availableStats.find(
        a =>
          String(a._id.seed) === String(l.seed?._id) &&
          a._id.block === l.block &&
          a._id.lot === l.lot
      );

      const stock = stockStats.find(
        s => String(s._id) === String(l.seed?._id)
      );

      return {
        _id: l._id,
        block: l.block,
        lot: l.lot,
        seed: l.seed || null,

        // PER LOT
        available: avail?.available || 0,

        // GLOBAL PER SEED
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
