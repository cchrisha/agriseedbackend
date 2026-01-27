import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const seedId = req.body.seedId;
    const quantity = Number(req.body.quantity);
    const action = req.body.action;

    if (!seedId || !quantity || quantity <= 0 || !action) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const seed = await Seed.findById(seedId);
    if (!seed) return res.status(404).json({ message: "Seed not found" });

    // =========================
    // STOCK-IN (CREATE NEW)
    // =========================
    if (action === "STOCK-IN") {
      const lastStock = await SeedStock.findOne({ seed: seedId }).sort({
        stockNo: -1,
      });

      const startNo = lastStock ? lastStock.stockNo + 1 : 1;
      const endNo = startNo + quantity - 1;

      const stocks = [];

      for (let i = startNo; i <= endNo; i++) {
        stocks.push({
          seed: seedId,
          stockNo: i,
          tag: `${seed.tag}-${i}`,
          status: "STOCK-IN",
        });
      }

      await SeedStock.insertMany(stocks);

      return res.json({ message: "Stock-in successful" });
    }

    // =========================
    // INSERT-IN (FROM STOCK-IN)
    // =========================
    if (action === "INSERT-IN") {
      const stocks = await SeedStock.find({
        seed: seedId,
        status: "STOCK-IN",
      })
        .sort({ stockNo: 1 })
        .limit(quantity);

      if (stocks.length < quantity)
        return res.status(400).json({ message: "Not enough STOCK-IN" });

      await SeedStock.updateMany(
        { _id: { $in: stocks.map((s) => s._id) } },
        { $set: { status: "INSERT-IN" } }
      );

      return res.json({ message: "Insert-in successful" });
    }

    // =========================
    // STOCK-OUT / MORTALITY (FROM INSERT-IN)
    // =========================
    if (["STOCK-OUT", "MORTALITY"].includes(action)) {
      const stocks = await SeedStock.find({
        seed: seedId,
        status: "INSERT-IN",
      })
        .sort({ stockNo: 1 })
        .limit(quantity);

      if (stocks.length < quantity)
        return res.status(400).json({ message: "Not enough INSERT-IN" });

      await SeedStock.updateMany(
        { _id: { $in: stocks.map((s) => s._id) } },
        { $set: { status: action } }
      );

      return res.json({ message: `${action} successful` });
    }

    // =========================
    // REPLACED (FROM STOCK-IN ONLY)
    // =========================
    if (action === "REPLACED") {
      const stocks = await SeedStock.find({
        seed: seedId,
        status: "STOCK-IN",
      })
        .sort({ stockNo: 1 })
        .limit(quantity);

      if (stocks.length < quantity)
        return res.status(400).json({ message: "Not enough STOCK-IN for replacement" });

      await SeedStock.updateMany(
        { _id: { $in: stocks.map((s) => s._id) } },
        { $set: { status: "REPLACED" } }
      );

      return res.json({ message: "Replacement successful" });
    }

    return res.status(400).json({ message: "Invalid action" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
