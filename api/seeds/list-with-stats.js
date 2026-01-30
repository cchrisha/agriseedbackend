import dbConnect from "../../lib/db.js";
import SeedStock from "../../models/SeedStock.js";
import Seed from "../../models/Seed.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const planted = await SeedStock.aggregate([
      {
        $match: { status: "INSERT-IN" },
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

      {
        $lookup: {
          from: "seeds",
          localField: "_id.seed",
          foreignField: "_id",
          as: "seed",
        },
      },

      { $unwind: "$seed" },

      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$seed",
              {
                block: "$_id.block",
                lot: "$_id.lot",
                available: "$available",
                distributed: 0,
                mortality: 0,
                stocks: 0,
                replaced: 0,
                total: "$available",
              },
            ],
          },
        },
      },
    ]);

    return res.json(planted);
  } catch (err) {
    console.error("LIST ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
