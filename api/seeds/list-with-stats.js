import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    await dbConnect();

    const seeds = await Seed.aggregate([
      {
        $lookup: {
          from: "seedstocks",
          localField: "_id",
          foreignField: "seed",
          as: "stocks",
        },
      },
      {
        $lookup: {
          from: "seedtransactions",
          localField: "_id",
          foreignField: "seed",
          as: "transactions",
        },
      },
      {
        $addFields: {
          totalStock: { $sum: "$stocks.quantity" },

          distributed: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$transactions",
                    as: "t",
                    cond: { $eq: ["$$t.type", "DISTRIBUTE"] },
                  },
                },
                as: "x",
                in: "$$x.quantity",
              },
            },
          },

          mortality: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$transactions",
                    as: "t",
                    cond: { $eq: ["$$t.type", "MORTALITY"] },
                  },
                },
                as: "x",
                in: "$$x.quantity",
              },
            },
          },

          replaced: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$transactions",
                    as: "t",
                    cond: { $eq: ["$$t.type", "REPLACE"] },
                  },
                },
                as: "x",
                in: "$$x.quantity",
              },
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.json(seeds);
  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}
