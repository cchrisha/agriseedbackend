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
    // STOCK STATS
    // ===============================
    const stats = await SeedStock.aggregate([

      {
        $group: {
          _id: {
            seed: "$seed",
            block: "$block",
            lot: "$lot",
          },

          // AVAILABLE only when planted
          available: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "AVAILABLE"] },
                    { $ne: ["$block", null] },
                    { $ne: ["$lot", null] }
                  ]
                },
                1,
                0
              ]
            }
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

          // ALL STOCK-IN counted globally
          stocks: {
            $sum: { $cond: [{ $eq: ["$status", "STOCK-IN"] }, 1, 0] },
          },
        },
      },

      // JOIN SEED INFO
      {
        $lookup: {
          from: "seeds",
          localField: "_id.seed",
          foreignField: "_id",
          as: "seed",
        },
      },

      { $unwind: "$seed" },

      // FILTER DELETED SEEDS
      {
        $match: {
          $or: [
            { "seed.isDeleted": false },
            { "seed.isDeleted": { $exists: false } },
          ],
        },
      },

      {
        $project: {
          seedId: "$seed._id",
          name: "$seed.name",
          tag: "$seed.tag",
          block: "$_id.block",
          lot: "$_id.lot",
          available: 1,
          distributed: 1,
          mortality: 1,
          replaced: 1,
          stocks: 1,
        },
      },
    ]);

    // ===============================
    // MERGE LOT + STATS
    // ===============================
    const mergedLots = lots.map(l => {

      const stat = stats.find(
        s =>
          s.block === l.block &&
          s.lot === l.lot &&
          String(s.seedId) === String(l.seed?._id)
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
