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

    const { seedId, quantity, action, block, lot } = req.body;
    const qty = Number(quantity);

    const role = req.headers.role || "admin";
    const user = req.headers.user || "System";

    if (!seedId || !qty || qty <= 0 || !action) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const seed = await Seed.findById(seedId);
    if (!seed) return res.status(404).json({ message: "Seed not found" });

    // ===============================
    // 🌱 STOCK-IN (Add Stock)
    // ===============================
    if (action === "STOCK-IN") {

      const last = await SeedStock.findOne({ seed: seedId })
        .sort({ stockNo: -1 });

      const start = last ? last.stockNo + 1 : 1;

      const stocks = [];

      for (let i = 0; i < qty; i++) {
        stocks.push({
          seed: seedId,
          stockNo: start + i,
          tag: `${seed.tag}-${start + i}`,
          status: "STOCK-IN",
          block: null,
          lot: null,
        });
      }

      await SeedStock.insertMany(stocks, { ordered: false });

      await ActivityLog.create({
        user,
        role,
        seed: seed._id,
        seedName: seed.name,
        seedTag: seed.tag,
        quantity: qty,
        process: "STOCK-IN",
      });

      return res.json({ message: "Stock added" });
    }

    // ===============================
    // 📦 AVAILABLE (Add Available)
    // ===============================
    if (action === "AVAILABLE") {

      if (block == null || lot == null) {
        return res.status(400).json({ message: "Block & Lot required" });
      }

      const affected = await SeedStock.find({
        seed: seedId,
        status: "STOCK-IN",
      })
        .sort({ stockNo: 1 })
        .limit(qty);

      if (affected.length < qty) {
        return res.status(400).json({ message: "Not enough stock" });
      }

      await SeedStock.updateMany(
        { _id: { $in: affected.map(s => s._id) } },
        {
          $set: {
            status: "AVAILABLE",
            block: Number(block),
            lot: Number(lot),
          },
        }
      );

      await ActivityLog.create({
        user,
        role,
        seed: seed._id,
        seedName: seed.name,
        seedTag: seed.tag,
        quantity: qty,
        process: "AVAILABLE",
      });

      return res.json({ message: "Added to available inventory" });
    }

    // ===============================
    // 📤 STOCK-OUT (Distribute)
    // ===============================
    if (action === "STOCK-OUT") {

      const affected = await SeedStock.find({
        seed: seedId,
        status: "AVAILABLE",
      }).limit(qty);

      if (affected.length < qty) {
        return res.status(400).json({ message: "Not enough available" });
      }

      await SeedStock.updateMany(
        { _id: { $in: affected.map(s => s._id) } },
        { $set: { status: "STOCK-OUT" } }
      );

      await ActivityLog.create({
        user,
        role,
        seed: seed._id,
        seedName: seed.name,
        seedTag: seed.tag,
        quantity: qty,
        process: "STOCK-OUT",
      });

      return res.json({ message: "Distributed successfully" });
    }

    // ===============================
    // ☠ MORTALITY
    // ===============================
    if (action === "MORTALITY") {

      const affected = await SeedStock.find({
        seed: seedId,
        status: "AVAILABLE",
      }).limit(qty);

      if (affected.length < qty) {
        return res.status(400).json({ message: "Not enough available" });
      }

      await SeedStock.updateMany(
        { _id: { $in: affected.map(s => s._id) } },
        { $set: { status: "MORTALITY" } }
      );

      await ActivityLog.create({
        user,
        role,
        seed: seed._id,
        seedName: seed.name,
        seedTag: seed.tag,
        quantity: qty,
        process: "MORTALITY",
      });

      return res.json({ message: "Marked as mortality" });
    }

    // ===============================
    // 🔁 REPLACED
    // ===============================
    if (action === "REPLACED") {

      const affected = await SeedStock.find({
        seed: seedId,
        status: "AVAILABLE",
      }).limit(qty);

      if (affected.length < qty) {
        return res.status(400).json({ message: "Not enough available" });
      }

      await SeedStock.updateMany(
        { _id: { $in: affected.map(s => s._id) } },
        { $set: { status: "REPLACED" } }
      );

      await ActivityLog.create({
        user,
        role,
        seed: seed._id,
        seedName: seed.name,
        seedTag: seed.tag,
        quantity: qty,
        process: "REPLACED",
      });

      return res.json({ message: "Replaced successfully" });
    }

    return res.status(400).json({ message: "Unknown action" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}
