import dbConnect from "../../lib/db.js";
import User from "../../models/User.js";
import { auth } from "../../middleware/auth.js";
import { allow } from "../../middleware/allow.js";

export default async function handler(req, res) {
  if (req.method !== "DELETE")
    return res.status(405).json({ message: "Method not allowed" });

  try {
await dbConnect();

const admin = auth(req);
if (!admin || !allow(admin, "admin")) {
  return res.status(401).json({ message: "Unauthorized" });
}

    const { userId } = req.body;

    const user = await User.findByIdAndDelete(userId);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
}
