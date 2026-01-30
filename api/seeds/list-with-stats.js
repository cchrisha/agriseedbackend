import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";

export default async function handler(req, res) {

  await dbConnect();

  try {

    const seeds = await Seed.aggregate([

      {
        $match: {
          $or: [
            { isDeleted: false },
            { isDeleted: { $exists: false } },
          ],
        },
      },

      {
        $lookup: {
          from: "seedstocks",
          localField: "_id",
          foreignField: "seed",
          as: "stocks",
        },
      },

      {
        $addFields: {

          total: { $size: "$stocks" },

          stocks: {
            $size: {
              $filter: {
                input: "$stocks",
                as: "s",
                cond: { $eq: ["$$s.status", "STOCK-IN"] },
              },
            },
          },

          available: {
            $size: {
              $filter: {
                input: "$stocks",
                as: "s",
                cond: { $eq: ["$$s.status", "INSERT-IN"] },
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

      { $sort: { createdAt: -1 } },

    ]);

    res.json(seeds);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}
