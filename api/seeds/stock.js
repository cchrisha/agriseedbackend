import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";
import ActivityLog from "../../models/ActivityLog.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    await dbConnect();

    const { seedId, quantity, action } = req.body;

    if (!seedId || !quantity || quantity <= 0 || !action)
      return res.status(400).json({ message: "Invalid input" });

    const seed = await Seed.findById(seedId);
    if (!seed) return res.status(404).json({ message: "Seed not found" });

    // ================= STOCK-IN =================
    if (action === "STOCK-IN") {
      const last = await SeedStock.findOne({ seed: seedId }).sort({ stockNo: -1 });
      const start = last ? last.stockNo + 1 : 1;

      const stocks = Array.from({ length: quantity }, (_, i) => ({
        seed: seedId,
        stockNo: start + i,
        tag: `${seed.tag}-${start + i}`,
        status: "STOCK-IN",
      }));

      await SeedStock.insertMany(stocks);
    }

    // ================= INSERT-IN =================
    if (action === "INSERT-IN") {
      const stocks = await SeedStock.find({ seed: seedId, status: "STOCK-IN" }).limit(quantity);
      if (stocks.length < quantity) return res.status(400).json({ message: "Not enough seedlings" });

      await SeedStock.updateMany({ _id: { $in: stocks.map(s => s._id) } }, { status: "INSERT-IN" });
    }

    // ================= STOCK-OUT / MORTALITY =================
    if (["STOCK-OUT", "MORTALITY"].includes(action)) {
      const stocks = await SeedStock.find({ seed: seedId, status: "INSERT-IN" }).limit(quantity);
      if (stocks.length < quantity) return res.status(400).json({ message: "Not enough seedlings" });

      await SeedStock.updateMany({ _id: { $in: stocks.map(s => s._id) } }, { status: action });
    }

    // ================= REPLACED =================
    if (action === "REPLACED") {
      const stocks = await SeedStock.find({ seed: seedId, status: "STOCK-IN" }).limit(quantity);
      if (stocks.length < quantity) return res.status(400).json({ message: "Not enough seedlings" });

      await SeedStock.updateMany({ _id: { $in: stocks.map(s => s._id) } }, { status: "REPLACED" });
    }

    // ✅ UNIVERSAL LOG
    await ActivityLog.create({
      user: req.user?.name || "System",
      seed: seedId,
      seedName: seed.name,
      seedTag: seed.tag,
      quantity,
      process: action,
    });

    return res.json({ message: `${action} successful` });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
