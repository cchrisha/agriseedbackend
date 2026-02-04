import dbConnect from "../../lib/db.js";
import SeedStock from "../../models/SeedStock.js";
import Seed from "../../models/Seed.js";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {

    await dbConnect();

    const stats = await Seed.aggregate([

      {
        $match: {
          $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
        },
      },

      // join stocks
      {
        $lookup: {
          from: "seedstocks",
          localField: "_id",
          foreignField: "seed",
          as: "stocks",
        },
      },

      // get FIRST planted location
      {
        $addFields: {
          planted: {
            $first: {
              $filter: {
                input: "$stocks",
                as: "s",
                cond: { $eq: ["$$s.status", "AVAILABLE"] },
              },
            },
          },
        },
      },

      // compute stats
      {
        $addFields: {

          available: {
            $size: {
              $filter: {
                input: "$stocks",
                as: "s",
                cond: { $eq: ["$$s.status", "AVAILABLE"] },
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

          stocks: { $size: "$stocks" },
        },
      },

      {
        $project: {
          name: 1,
          tag: 1,
          block: "$planted.block",
          lot: "$planted.lot",
          available: 1,
          distributed: 1,
          mortality: 1,
          replaced: 1,
          stocks: 1,
          total: "$stocks",
        },
      },

    ]);

    return res.json(stats);

  } catch (err) {
    console.error("LIST ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}
