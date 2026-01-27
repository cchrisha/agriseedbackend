import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const seeds = await Seed.find(
      {
        $or: [
          { isDeleted: false },
          { isDeleted: { $exists: false } } // para sa old seeds
        ]
      },
      {
        name: 1,
        block: 1,
        lot: 1,
        tag: 1,
      }
    ).sort({ createdAt: -1 });

    res.json(seeds);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
