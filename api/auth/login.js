import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "../../lib/db.js";
import User from "../../models/User.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  const { action, email, password } = req.body;

  // =====================================================
  // 🔐 LOGIN
  // =====================================================
  if (!action || action === "login") {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      role: user.role,
      name: user.name,
    });
  }

  // =====================================================
  // 🚪 LOGOUT
  // =====================================================
  if (action === "logout") {
    return res.json({
      message: "Logout successful",
    });
  }

  // =====================================================
  // ❌ INVALID ACTION
  // =====================================================
  return res.status(400).json({
    message: "Invalid action",
  });
}