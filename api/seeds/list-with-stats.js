import dbConnect from "../../lib/db.js";
import SeedStock from "../../models/SeedStock.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const data = await SeedStock.aggregate([
      {
        $lookup: {
          from: "seeds",
          localField: "seed",
          foreignField: "_id",
          as: "seedInfo",
        },
      },

      { $unwind: "$seedInfo" },

      {
        $group: {
          _id: {
            block: "$block",
            lot: "$lot",
            seed: "$seed",
          },

          name: { $first: "$seedInfo.name" },
          tag: { $first: "$seedInfo.tag" },

          total: { $sum: 1 },

          stocks: {
            $sum: {
              $cond: [{ $eq: ["$status", "STOCK-IN"] }, 1, 0],
            },
          },

          available: {
            $sum: {
              $cond: [{ $eq: ["$status", "INSERT-IN"] }, 1, 0],
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
        },
      },

      {
        $project: {
          _id: 0,
          block: "$_id.block",
          lot: "$_id.lot",
          seed: "$_id.seed",
          name: 1,
          tag: 1,
          total: 1,
          stocks: 1,
          available: 1,
          distributed: 1,
          mortality: 1,
          replaced: 1,
        },
      },

      { $sort: { block: 1, lot: 1 } },
    ]);

    return res.json(data);

  } catch (err) {
    console.error("FETCH ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
