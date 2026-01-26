import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedStock from "../../models/SeedStock.js";

export default async function handler(req, res) {
  await dbConnect();

  // =========================
  // GET REQUESTS
  // =========================
  if (req.method === "GET") {
    try {
      const { seedId, stats, occupied } = req.query;

      // -------------------------
      // FETCH STOCKS BY SEED
      // -------------------------
      if (seedId) {
        const stocks = await SeedStock.find({ seed: seedId }).sort({
          stockNo: 1,
        });

        return res.json(stocks);
      }

      // -------------------------
      // SEEDS WITH STATS
      // -------------------------
      if (stats === "true") {
        const seeds = await Seed.aggregate([
          {
            $lookup: {
              from: "seedstocks",
              localField: "_id",
              foreignField: "seed",
              as: "stocks",
            },
          },
          {
            $addFields: {
              totalStock: { $size: "$stocks" },

              available: {
                $size: {
                  $filter: {
                    input: "$stocks",
                    as: "s",
                    cond: { $eq: ["$$s.status", "STOCK-IN"] },
                  },
                },
              },

              distributed: {
                $size: {
                  $filter: {
                    input: "$stocks",
                    as: "s",
                    cond: { $eq: ["$$s.status", "STOCK-OUT"] },
                  },
                },
              },

              mortality: {
                $size: {
                  $filter: {
                    input: "$stocks",
                    as: "s",
                    cond: { $eq: ["$$s.status", "MORTALITY"] },
                  },
                },
              },

              replaced: {
                $size: {
                  $filter: {
                    input: "$stocks",
                    as: "s",
                    cond: { $eq: ["$$s.status", "REPLACED"] },
                  },
                },
              },
            },
          },
          {
            $project: { stocks: 0 },
          },
          {
            $sort: { createdAt: -1 },
          },
        ]);

        return res.json(seeds);
      }

      // -------------------------
      // OCCUPIED BLOCK / LOT
      // -------------------------
      if (occupied === "true") {
        const seeds = await Seed.find({}, { block: 1, lot: 1 });

        const occupiedLots = seeds.map(s => ({
          block: s.block,
          lot: s.lot,
        }));

        return res.json(occupiedLots);
      }

      // ======================
    // BASIC SEED LIST
    // ======================
    const seeds = await Seed.find(
      {},
      {
        name: 1,
        block: 1,
        lot: 1,
        tag: 1,
      }
    ).sort({ createdAt: -1 });

    return res.json(seeds);
  } catch (err) {
    console.error("SEED FETCH ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
  }

  

  // =========================
  // POST REQUEST (ACTIONS)
  // =========================
  if (req.method === "POST") {
    try {
      const { seedId, quantity, action } = req.body;

      if (!seedId || !quantity || quantity <= 0 || !action) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const seed = await Seed.findById(seedId);
      if (!seed) return res.status(404).json({ message: "Seed not found" });

      // -------------------------
      // STOCK-IN
      // -------------------------
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
          });
        }

        await SeedStock.insertMany(stocks);

        return res.status(201).json({
          message: "Stock added successfully",
          from: startNo,
          to: endNo,
        });
      }

      // -------------------------
      // STOCK-OUT / MORTALITY / REPLACED
      // -------------------------
      if (["STOCK-OUT", "MORTALITY", "REPLACED"].includes(action)) {
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

        const stockIds = availableStocks.map(s => s._id);

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

      return res.status(400).json({ message: "Invalid action" });
    } catch (err) {
      console.error("POST STOCK ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
