import dbConnect from "../../lib/db.js";
import User from "../../models/User.js";
import { auth } from "../../middleware/auth.js";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const decoded = auth(req);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

  } catch (err) {
    console.error("ME API ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
