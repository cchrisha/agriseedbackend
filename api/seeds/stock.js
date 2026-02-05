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
    // LOT STATS (AVAILABLE PER BLOCK+LOT)
    // ===============================

    const lotStats = await SeedStock.aggregate([
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
    // WAREHOUSE STOCKS (GLOBAL PER SEED)
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

      const avail = lotStats.find(
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
