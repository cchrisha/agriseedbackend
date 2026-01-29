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

    const {
      seedId,
      quantity,
      action,
      block, // only for INSERT-IN
      lot,   // only for INSERT-IN
    } = req.body;

    const qty = Number(quantity);

    const role = req.headers.role || "admin";
    const user = req.headers.user || "System";

    if (!seedId || !qty || qty <= 0 || !action) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const seed = await Seed.findById(seedId);
    if (!seed) return res.status(404).json({ message: "Seed not found" });

    let affected = [];

    // =========================
    // STOCK-IN (NURSERY / EXTRA)
    // =========================
    if (action === "STOCK-IN") {
      const lastStock = await SeedStock.findOne({ seed: seedId }).sort({
        stockNo: -1,
      });

      const startNo = lastStock ? lastStock.stockNo + 1 : 1;
      const endNo = startNo + qty - 1;

      const stocks = [];

      for (let i = startNo; i <= endNo; i++) {
        stocks.push({
          seed: seedId,
          stockNo: i,
          tag: `${seed.tag}-${i}`,
          status: "STOCK-IN",
          block: null,
          lot: null,
        });
      }

      affected = await SeedStock.insertMany(stocks);
    }

    // =========================
    // INSERT-IN (PLANTING → AVAILABLE)
    // =========================
    if (action === "INSERT-IN") {

      if (!block || !lot)
        return res.status(400).json({ message: "Block & Lot required" });

      // ❌ bawal kung occupied na
      const occupied = await SeedStock.findOne({
        block,
        lot,
        status: "INSERT-IN",
      });

      if (occupied) {
        return res.status(400).json({
          message: "Block and Lot already occupied",
        });
      }

      affected = await SeedStock.find({
        seed: seedId,
        status: "STOCK-IN",
      })
        .sort({ stockNo: 1 })
        .limit(qty);

      if (affected.length < qty)
        return res.status(400).json({ message: "Not enough nursery stock" });

      await SeedStock.updateMany(
        { _id: { $in: affected.map(s => s._id) } },
        {
          $set: {
            status: "INSERT-IN",
            block,
            lot,
          },
        }
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
        .limit(qty);

      if (affected.length < qty)
        return res.status(400).json({ message: "Not enough available seedlings" });

      await SeedStock.updateMany(
        { _id: { $in: affected.map(s => s._id) } },
        { $set: { status: action } }
      );
    }

    // =========================
    // REPLACED (FROM STOCK-IN)
    // =========================
    if (action === "REPLACED") {
      affected = await SeedStock.find({
        seed: seedId,
        status: "STOCK-IN",
      })
        .sort({ stockNo: 1 })
        .limit(qty);

      if (affected.length < qty)
        return res
          .status(400)
          .json({ message: "Not enough nursery stock for replacement" });

      await SeedStock.updateMany(
        { _id: { $in: affected.map(s => s._id) } },
        { $set: { status: "REPLACED" } }
      );
    }

    // =========================
    // ACTIVITY LOG
    // =========================
    try {
      await ActivityLog.create({
        user,
        role,
        seed: seed._id,
        seedName: seed.name,
        seedTag: seed.tag,
        quantity: qty,
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
