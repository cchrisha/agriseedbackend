import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const seeds = await Seed.aggregate([
      {
        // 🔗 Join SeedStock
        $lookup: {
          from: "seedstocks",
          localField: "_id",
          foreignField: "seed",
          as: "stocks",
        },
      },
      {
        // 📊 Compute counts by status
        $addFields: {
          totalStock: { $size: "$stocks" },

          available: {
            $size: {
              $filter: {
                input: "$stocks",
                as: "s",
                cond: { $eq: ["$$s.status", "STOCK-IN"] },
              },
            },
          },

          distributed: {
            $size: {
              $filter: {
                input: "$stocks",
                as: "s",
                cond: { $eq: ["$$s.status", "STOCK-OUT"] },
              },
            },
          },

          mortality: {
            $size: {
              $filter: {
                input: "$stocks",
                as: "s",
                cond: { $eq: ["$$s.status", "MORTALITY"] },
              },
            },
          },

          replaced: {
            $size: {
              $filter: {
                input: "$stocks",
                as: "s",
                cond: { $eq: ["$$s.status", "REPLACED"] },
              },
            },
          },
        },
      },
      {
        // 🧹 Optional: alisin ang raw stocks array (lighter payload)
        $project: {
          stocks: 0,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    res.json(seeds);
  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}
