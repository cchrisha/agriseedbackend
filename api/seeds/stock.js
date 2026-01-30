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

    // 🌱 STOCK-IN
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

    // 🌾 INSERT-IN
    if (action === "INSERT-IN") {

      if (!block || !lot) {
        return res.status(400).json({ message: "Block & Lot required" });
      }

      const occupied = await SeedStock.findOne({
        block,
        lot,
        status: "INSERT-IN",
      });

      if (occupied) {
        return res.status(400).json({ message: "Occupied" });
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
            status: "INSERT-IN",
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
        process: "INSERT-IN",
      });

      return res.json({ message: "Seedlings planted" });
    }

    res.status(400).json({ message: "Unknown action" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}
