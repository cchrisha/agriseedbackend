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

    // 🔐 ONLY CHANGE — block deleted seeds
    const seed = await Seed.findOne({
      _id: seedId,
      isDeleted: false
    });

    if (!seed) {
      return res.status(404).json({ message: "Seed not found or deleted" });
    }

    // =========================
    // STOCK-IN
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

      return res.status(201).json({
        message: "Stock added successfully",
        from: startNo,
        to: endNo,
        quantity,
      });
    }

    // =========================
    // STOCK-OUT / MORTALITY 
    // =========================
    if (["STOCK-OUT", "MORTALITY"].includes(action)) {
      const availableStocks = await SeedStock.find({
        seed: seedId,
        status: "STOCK-IN",
      })
        .sort({ stockNo: 1 })
        .limit(quantity);

      if (availableStocks.length < quantity) {
        return res.status(400).json({
          message: "Not enough available stock",
          available: availableStocks.length,
        });
      }

      const stockIds = availableStocks.map((s) => s._id);

      await SeedStock.updateMany(
        { _id: { $in: stockIds } },
        { $set: { status: action } }
      );

      return res.status(200).json({
        message: `${action} successful`,
        from: availableStocks[0].stockNo,
        to: availableStocks[availableStocks.length - 1].stockNo,
        quantity,
      });
    }

    // =========================
    // REPLACED
    // =========================
    if (action === "REPLACED") {
      const mortalityStocks = await SeedStock.find({
        seed: seedId,
        status: "MORTALITY",
      })
        .sort({ stockNo: 1 })
        .limit(quantity);

      if (!mortalityStocks.length) {
        return res.status(400).json({
          message: "No mortality to replace",
        });
      }

      if (mortalityStocks.length < quantity) {
        return res.status(400).json({
          message: "Replacement exceeds mortality count",
          mortality: mortalityStocks.length,
        });
      }

      const stockIds = mortalityStocks.map((s) => s._id);

      await SeedStock.updateMany(
        { _id: { $in: stockIds } },
        { $set: { status: "REPLACED" } }
      );

      const lastStock = await SeedStock.findOne({ seed: seedId }).sort({
        stockNo: -1,
      });

      const startNo = lastStock ? lastStock.stockNo + 1 : 1;
      const endNo = startNo + quantity - 1;

      const newStocks = [];

      for (let i = startNo; i <= endNo; i++) {
        newStocks.push({
          seed: seedId,
          stockNo: i,
          tag: `${seed.tag}-${i}`,
          status: "STOCK-IN",
        });
      }

      await SeedStock.insertMany(newStocks);

      return res.status(200).json({
        message: "Replacement successful",
        replaced: quantity,
        addedToAvailable: quantity,
      });
    }

    return res.status(400).json({ message: "Invalid action" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}