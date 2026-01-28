import dbConnect from "../../lib/db.js";
import ActivityLog from "../../models/ActivityLog.js";

export default async function handler(req, res) {
  await dbConnect();

  const logs = await ActivityLog.find()
    .select("user process seedName quantity createdAt")
    .sort({ createdAt: -1 });

  res.json(logs);
}
