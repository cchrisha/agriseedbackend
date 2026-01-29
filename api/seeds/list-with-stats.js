import dbConnect from "../../lib/db.js";
import SeedStock from "../../models/SeedStock.js";
import Seed from "../../models/Seed.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const data = await SeedStock.aggregate([
      {
        // ONLY PLANTED
        $match: {
          status: "INSERT-IN",
        },
      },

      // JOIN seed info
      {
        $lookup: {
          from: "seeds",
          localField: "seed",
          foreignField: "_id",
          as: "seedInfo",
        },
      },

      { $unwind: "$seedInfo" },

      // GROUP BY BLOCK + LOT + SEED
      {
        $group: {
          _id: {
            block: "$block",
            lot: "$lot",
            seed: "$seed",
          },

          name: { $first: "$seedInfo.name" },
          tag: { $first: "$seedInfo.tag" },

          available: { $sum: 1 },
        },
      },

      // FORMAT OUTPUT
      {
        $project: {
          _id: 0,
          block: "$_id.block",
          lot: "$_id.lot",
          seed: "$_id.seed",
          name: 1,
          tag: 1,
          available: 1,
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
