import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";
import Lot from "../../models/Lot.js";

export default async function handler(req, res) {

 if (req.method !== "GET")
  return res.status(405).json({ message: "Method not allowed" });

 try {

  await dbConnect();

  const seeds = await Seed.find({
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  });

  const lots = await Lot.find().populate("seed");

  // ===============================
  // PER LOT RAW COUNTS
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

        replaced: {
          $sum: { $cond: [{ $eq: ["$status", "REPLACED"] }, 1, 0] },
        },
      },
    },
  ]);

  // ===============================
  // WAREHOUSE
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

    const w = warehouse.find(
      x => String(x._id) === String(l.seed?._id)
    );

    const rawAvailable = s?.available || 0;
    const rawReplaced = s?.replaced || 0;

    return {
      _id: l._id,
      block: l.block,
      lot: l.lot,
      seed: l.seed,

      // ✅ AVAILABLE + REPLACED
      available: rawAvailable + rawReplaced,

      // ✅ DOCUMENTATION COUNTS
      mortality: s?.mortality || 0,
      distributed: s?.distributed || 0,
      replaced: rawReplaced,

      // ✅ GLOBAL
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
