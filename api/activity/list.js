import dbConnect from "../../lib/db.js";
import ActivityLog from "../../models/ActivityLog.js";

export default async function handler(req, res) {

  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  try {

    await dbConnect();

    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 }); // newest first

    return res.json(logs);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
