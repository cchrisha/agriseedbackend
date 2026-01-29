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
      block,
      lot,
    } = req.body;

    const qty = Number(quantity);

    const role = req.headers.role || "admin";
    const user = req.headers.user || "System";

    if (!seedId || !qty || qty <= 0 || !action) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const seed = await Seed.findById(seedId).lean();
    if (!seed) return res.status(404).json({ message: "Seed not found" });

    let affected = [];

    // =========================
    // STOCK-IN (NURSERY / EXTRA)
    // =========================
    if (action === "STOCK-IN") {

      const lastStock = await SeedStock.findOne({ seed: seedId })
        .sort({ stockNo: -1 })
        .lean();

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

      await SeedStock.insertMany(stocks);

      // ACTIVITY LOG
      try {
        await ActivityLog.create({
          user,
          role,
          seed: seed._id,
          seedName: seed.name,
          seedTag: seed.tag,
          quantity: qty,
          process: "STOCK-IN",
        });
      } catch (e) {
        console.error("LOG FAILED", e);
      }

      return res.status(201).json({ message: "Stock added" });
    }

    // =========================
    // INSERT-IN (PLANTING → AVAILABLE)
    // =========================
    // (leave commented)

    // =========================
    // STOCK-OUT / MORTALITY
    // =========================
    // (leave commented)

    // =========================
    // REPLACED
    // =========================
    // (leave commented)

    return res.status(400).json({ message: "Unknown action" });

  } catch (err) {
    console.error("STOCK API ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
