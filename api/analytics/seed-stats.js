import dbConnect from "../../lib/db.js";
import SeedStock from "../../models/SeedStock.js";

export default async function handler(req, res) {

  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  try {

    await dbConnect();

    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;

    // ===============================
    // 🥧 MONTHLY PIE (REAL DB STATUS)
    // ===============================

    const pie = await SeedStock.aggregate([
      {
        $match: {
          status: { $in: ["AVAILABLE", "STOCK-OUT", "MORTALITY"] },
          updatedAt: {
            $gte: new Date(year, month - 1, 1),
            $lt: new Date(year, month, 1),
          }
        }
      },
      {
        $group: {
          _id: "$status",
          total: { $sum: 1 }
        }
      }
    ]);

    // ===============================
    // 📊 YEARLY BAR (REAL DB COUNTS)
    // ===============================

    const bar = await SeedStock.aggregate([
      {
        $match: {
          status: "STOCK-OUT",
          updatedAt: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1),
          }
        }
      },
      {
        $group: {
          _id: { month: { $month: "$updatedAt" } },
          total: { $sum: 1 }
        }
      },
      { $sort: { "_id.month": 1 } }
    ]);

    return res.json({
      year,
      month,
      pie,
      bar,
    });

  } catch (err) {
    console.error("ANALYTICS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}
