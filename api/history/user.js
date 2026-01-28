import dbConnect from "../../lib/db.js";
import ActivityLog from "../../models/ActivityLog.js";

export default async function handler(req, res) {
  await dbConnect();

  try {
    // ROLE comes from headers (temporary – until JWT middleware)
    const role = req.headers.role;

    // Only these roles can access USER history
    if (!["admin", "rnd", "op-h", "op-non"].includes(role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // USER HISTORY:
    // ❌ exclude CREATED + DELETED
    const logs = await ActivityLog.find({
      process: { $nin: ["CREATED", "DELETED"] },
    })
      .select("seedTag seedName quantity process createdAt")
      .sort({ createdAt: -1 });

    return res.json(logs);

  } catch (err) {
    console.error("USER HISTORY ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
