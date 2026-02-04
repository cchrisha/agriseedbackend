import dbConnect from "../../lib/db.js";
import SeedStock from "../../models/SeedStock.js";
import Seed from "../../models/Seed.js";

export default async function handler(req, res) {

  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  try {

    await dbConnect();

    const stats = await SeedStock.aggregate([

      // ONLY LOT RELATED STOCKS
      {
        $match: {
          block: { $ne: null },
          lot: { $ne: null },
        },
      },

      // GROUP PER SEED + BLOCK + LOT
      {
        $group: {
          _id: {
            seed: "$seed",
            block: "$block",
            lot: "$lot",
          },

          available: {
            $sum: {
              $cond: [{ $eq: ["$status", "AVAILABLE"] }, 1, 0],
            },
          },

          distributed: {
            $sum: {
              $cond: [{ $eq: ["$status", "STOCK-OUT"] }, 1, 0],
            },
          },

          mortality: {
            $sum: {
              $cond: [{ $eq: ["$status", "MORTALITY"] }, 1, 0],
            },
          },

          replaced: {
            $sum: {
              $cond: [{ $eq: ["$status", "REPLACED"] }, 1, 0],
            },
          },

          stocks: {
            $sum: {
              $cond: [{ $eq: ["$status", "STOCK-IN"] }, 1, 0],
            },
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

      // FINAL FORMAT
      {
        $project: {
          _id: "$seed._id",
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

    return res.json(stats);

  } catch (err) {
    console.error("LIST ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}
