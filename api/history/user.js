import dbConnect from "../../lib/db.js";
import ActivityLog from "../../models/ActivityLog.js";

export default async function handler(req, res) {
  await dbConnect();

  try {
    const role = req.headers.role;

    if (!["admin", "rnd", "op-h", "op-non"].includes(role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const logs = await ActivityLog.find({
      process: { $nin: ["CREATED", "DELETED","ASSIGNED-LOT","PLANTED"] },
    })
      .select("seedTag seedName quantity process createdAt")
      .sort({ createdAt: -1 });

    return res.json(logs);

  } catch (err) {
    console.error("USER HISTORY ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}