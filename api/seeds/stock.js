import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";
import ActivityLog from "../../models/ActivityLog.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const seedId = req.body.seedId;
    const quantity = Number(req.body.quantity);
    const action = req.body.action;

    const role = req.headers.role || "admin";
    const user = req.headers.user || "System";

    if (!seedId || !quantity || quantity <= 0 || !action) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const seed = await Seed.findById(seedId);
    if (!seed) return res.status(404).json({ message: "Seed not found" });

    let affected = [];

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

      affected = await SeedStock.insertMany(stocks);
    }

    // =========================
    // INSERT-IN
    // =========================
    if (action === "INSERT-IN") {
      affected = await SeedStock.find({
        seed: seedId,
        status: "STOCK-IN",
      })
        .sort({ stockNo: 1 })
        .limit(quantity);

      if (affected.length < quantity)
        return res.status(400).json({ message: "Not enough seedlings" });

      await SeedStock.updateMany(
        { _id: { $in: affected.map((s) => s._id) } },
        { $set: { status: "INSERT-IN" } }
      );
    }

    // =========================
    // STOCK-OUT / MORTALITY
    // =========================
    if (["STOCK-OUT", "MORTALITY"].includes(action)) {
      affected = await SeedStock.find({
        seed: seedId,
        status: "INSERT-IN",
      })
        .sort({ stockNo: 1 })
        .limit(quantity);

      if (affected.length < quantity)
        return res.status(400).json({ message: "Not enough seedlings" });

      await SeedStock.updateMany(
        { _id: { $in: affected.map((s) => s._id) } },
        { $set: { status: action } }
      );
    }

    // =========================
    // REPLACED
    // =========================
    if (action === "REPLACED") {
      affected = await SeedStock.find({
        seed: seedId,
        status: "STOCK-IN",
      })
        .sort({ stockNo: 1 })
        .limit(quantity);

      if (affected.length < quantity)
        return res
          .status(400)
          .json({ message: "Not enough seedlings for replacement" });

      await SeedStock.updateMany(
        { _id: { $in: affected.map((s) => s._id) } },
        { $set: { status: "REPLACED" } }
      );
    }

    // =========================
    // ACTIVITY LOG (SAFE)
    // =========================
    try {
      await ActivityLog.create({
        user,
        role,
        seed: seed._id,
        seedName: seed.name,
        seedTag: seed.tag,
        quantity,
        process: action,
      });
    } catch (e) {
      console.error("LOG FAILED", e);
    }

    return res.json({ message: `${action} successful` });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
