import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { seedId } = req.body;

    if (!seedId) {
      return res.status(400).json({ message: "Missing seedId" });
    }

    const seed = await Seed.findById(seedId);

    if (!seed) {
      return res.status(404).json({ message: "Seed not found" });
    }

    seed.isDeleted = true;
    seed.deletedAt = new Date();

    await seed.save();

    res.json({ message: "Seed soft deleted" });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}
