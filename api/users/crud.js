import bcrypt from "bcryptjs";
import dbConnect from "../../lib/db.js";
import User from "../../models/User.js";
import { auth } from "../../middleware/auth.js";
import { allow } from "../../middleware/allow.js";

export default async function handler(req, res) {
  await dbConnect();

  const user = auth(req);
  if (!user || !allow(user, "admin")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {

    // ================= CREATE USER =================
    if (req.method === "POST") {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "Missing fields" });
      }

      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hash = await bcrypt.hash(password, 10);

      const allowedRoles = ["admin", "rnd", "op-h", "op-non"];

      await User.create({
        name,
        email,
        password: hash,
        role: allowedRoles.includes(role) ? role : "rnd",
      });

      return res.status(201).json({
        message: `User ${name} created successfully`,
      });
    }

    // ================= LIST USERS =================
    if (req.method === "GET") {
      const users = await User.find().select("-password");
      return res.json(users);
    }

    // ================= UPDATE USER =================
    if (req.method === "PUT") {
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
    }

        // ================= DELETE USER =================
    if (req.method === "DELETE") {
      const { userId } = req.body;
      await User.findByIdAndDelete(userId);

      return res.json({ message: "User deleted successfully" });
    }

    return res.status(405).json({ message: "Method not allowed" });

  } catch (err) {
    console.error("USER API ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
