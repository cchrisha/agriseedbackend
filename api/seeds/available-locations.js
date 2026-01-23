import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { seedId } = req.query;

    // ✅ validate seedId
    if (!seedId) {
      return res.status(400).json({ message: "seedId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(seedId)) {
      return res.status(400).json({ message: "Invalid seedId" });
    }

    // (optional) check if seed exists
    const seedExists = await Seed.exists({ _id: seedId });
    if (!seedExists) {
      return res.status(404).json({ message: "Seed not found" });
    }

    // ✅ fetch available stock locations
    const stocks = await SeedStock.find({
      seed: seedId,
      quantity: { $gt: 0 },
    }).select("block lot quantity -_id");

    return res.status(200).json(stocks);
  } catch (err) {
    console.error("FETCH AVAILABLE LOCATIONS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
