import dbConnect from "../../lib/db.js";
import User from "../../models/User.js";
import { auth } from "../../middleware/auth.js";
import { allow } from "../../middleware/allow.js";

export default async function handler(req, res) {
  if (req.method !== "DELETE")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    await dbConnect();

  const user = auth(req);
  if (!user || !allow(user, "admin")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

    const { userId } = req.body;

    const targetUser = await User.findByIdAndDelete(userId);
    if (!targetUser)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
}
