import bcrypt from "bcryptjs";
import dbConnect from "../../lib/db.js";
import User from "../../models/User.js";
import { auth } from "../../middleware/auth.js";
import { allow } from "../../middleware/allow.js";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const user = auth(req);
    if (!user || !allow(user, "admin")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { userId, name, email, role, newPassword } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== targetUser.email) {
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    if (name !== undefined) targetUser.name = name;
    if (email !== undefined) targetUser.email = email;

    const allowedRoles = ["admin", "op", "rnd"];
    if (role && allowedRoles.includes(role)) {
      targetUser.role = role;
    }

    if (newPassword) {
      targetUser.password = await bcrypt.hash(newPassword, 10);
    }

    await targetUser.save();

    return res.json({ message: "User updated successfully" });

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}
