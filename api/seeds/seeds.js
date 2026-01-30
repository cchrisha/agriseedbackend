import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    // Seed list (dropdown)
    const seeds = await Seed.find(
      {
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
      },
      {
        name: 1,
        tag: 1,
      }
    ).sort({ createdAt: -1 });

    // OCCUPIED comes from SeedStock (INSERT-IN only)
    const occupied = await SeedStock.find(
      { status: "INSERT-IN" },
      { block: 1, lot: 1 }
    );

    return res.json({
      seeds,
      occupied,
    });

  } catch (err) {
    console.error("FETCH ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
