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

    const { userId, name, email, role } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
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

    targetUser.name = name ?? targetUser.name;
    targetUser.email = email ?? targetUser.email;
    targetUser.role = role ?? targetUser.role;

    await targetUser.save();

    return res.json({ message: "User updated successfully" });

  } catch (err) {
    console.error("UPDATE USER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
