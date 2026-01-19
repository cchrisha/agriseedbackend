import bcrypt from "bcryptjs";
import dbConnect from "../../lib/db.js";
import User from "../../models/User.js";
import { auth } from "../../middleware/auth.js";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const requester = auth(req);

    // 🔐 CHECK AUTH FIRST
    if (!requester) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 🔒 ADMIN OR SELF ONLY
    if (requester.role !== "admin" && requester.id !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    return res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
