import dbConnect from "../../lib/db.js";
import ActivityLog from "../../models/ActivityLog.js";

export default async function handler(req, res) {
  await dbConnect();

  try {
    const role = req.headers.role;

    if (role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const logs = await ActivityLog.find()
      .select("user process seedName seedTag quantity createdAt")
      .sort({ createdAt: -1 });

    return res.json(logs);

  } catch (err) {
    console.error("ADMIN HISTORY ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}