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
        $project: {
          _id: "$seed._id",
          name: "$seed.name",
          tag: "$seed.tag",

          block: "$_id.block",
          lot: "$_id.lot",

          available: 1,

          distributed: { $literal: 0 },
          mortality: { $literal: 0 },
          stocks: { $literal: 0 },

          total: "$available",
        },
      },
    ]);

    return res.json(planted);

  } catch (err) {
    console.error("LIST ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
