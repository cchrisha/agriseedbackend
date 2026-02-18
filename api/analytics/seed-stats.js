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

    const allowedProcesses = ["AVAILABLE", "STOCK-OUT", "MORTALITY"];

    // ================= PIE (MONTHLY) =================

    const pie = await ActivityLog.aggregate([
      {
        $match: {
          process: { $in: allowedProcesses },
          createdAt: {
            $gte: new Date(year, month - 1, 1),
            $lt: new Date(year, month, 1),
          }
        }
      },
      {
        $group: {
          _id: "$process",
          total: { $sum: "$quantity" }
        }
      }
    ]);

    // ================= BAR (YEARLY + PROCESS) =================

    const bar = await ActivityLog.aggregate([
      {
        $match: {
          process: { $in: allowedProcesses },
          createdAt: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1),
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            process: "$process"
          },
          total: { $sum: "$quantity" }
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
