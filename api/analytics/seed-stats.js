import dbConnect from "../../lib/db.js";
import ActivityLog from "../../models/ActivityLog.js";

export default async function handler(req, res) {

  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  try {

    await dbConnect();

    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;

    // ===============================
    // 🥧 MONTHLY PIE
    // ===============================

    const monthly = await ActivityLog.aggregate([
      {
        $match: {
          process: { $in: ["AVAILABLE", "STOCK-OUT", "MORTALITY"] },
          createdAt: {
            $gte: new Date(year, month - 1, 1),
            $lt: new Date(year, month, 1),
          },
        },
      },
      {
        $group: {
          _id: "$process",
          total: { $sum: "$quantity" },
        },
      },
    ]);

    // ===============================
    // 📊 YEARLY BAR (STOCK-OUT ONLY)
    // ===============================

    const yearly = await ActivityLog.aggregate([
      {
        $match: {
          process: "STOCK-OUT",
          createdAt: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          total: { $sum: "$quantity" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    return res.json({
      year,
      month,
      pie: monthly,
      bar: yearly,
    });

  } catch (err) {
    console.error("ANALYTICS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}
