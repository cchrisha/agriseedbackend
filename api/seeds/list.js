import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    // 🔗 JOIN Seed + SeedStock
    const seeds = await Seed.aggregate([
      {
        $lookup: {
          from: "seedstocks", // collection name (pluralized)
          localField: "_id",
          foreignField: "seed",
          as: "stocks",
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    return res.json(seeds);
  } catch (err) {
    console.error("FETCH SEEDS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
