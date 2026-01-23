import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ message: "Seed name required" });
    }

    const seed = await Seed.findOne({ name });
    if (!seed) {
      return res.status(404).json({ message: "Seed not found" });
    }

    const stocks = await SeedStock.find({
      seed: seed._id,
      quantity: { $gt: 0 },
    }).select("block lot quantity");

    res.json(stocks);
  } catch (err) {
    console.error("FETCH LOCATIONS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}
