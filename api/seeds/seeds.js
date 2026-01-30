import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    // ===============================
    // GET SEEDS + FIRST INSERT LOCATION
    // ===============================
    const seeds = await Seed.aggregate([
      {
        $match: {
          $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
        },
      },

      // join seedstocks
      {
        $lookup: {
          from: "seedstocks",
          localField: "_id",
          foreignField: "seed",
          as: "stocks",
        },
      },

      // pick FIRST INSERT-IN as block+lot
      {
        $addFields: {
          planted: {
            $first: {
              $filter: {
                input: "$stocks",
                as: "s",
                cond: { $eq: ["$$s.status", "INSERT-IN"] },
              },
            },
          },
        },
      },

      {
        $project: {
          name: 1,
          tag: 1,
          block: "$planted.block",
          lot: "$planted.lot",
        },
      },
    ]);

    // ===============================
    // UNIQUE OCCUPIED BLOCK+LOT
    // ===============================
    const occupied = await SeedStock.aggregate([
      { $match: { status: "INSERT-IN" } },

      {
        $group: {
          _id: {
            block: "$block",
            lot: "$lot",
          },
        },
      },

      {
        $project: {
          _id: 0,
          block: "$_id.block",
          lot: "$_id.lot",
        },
      },
    ]);

    return res.json({ seeds, occupied });

  } catch (err) {
    console.error("FETCH ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
