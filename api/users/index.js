import bcrypt from "bcryptjs";
import dbConnect from "../../lib/db";
import User from "../../models/User";
import { auth } from "../../middleware/auth";
import { allow } from "../../middleware/allow";

export default async function handler(req, res) {
  try {
    await dbConnect();

    // 🔐 AUTH (ADMIN ONLY)
    const user = auth(req);
    if (!user || !allow(user, "admin")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // =========================
    // 🟢 LIST USERS
    // =========================
    if (req.method === "GET") {
      const users = await User.find()
        .select("-password")
        .sort({ createdAt: -1 });

      return res.status(200).json(users);
    }

    // =========================
    // 🟢 CREATE USER
    // =========================
    if (req.method === "POST") {
      const { name, email, password, role } = req.body;

      // basic validation
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Missing fields" });
      }

      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hash = await bcrypt.hash(password, 10);

      await User.create({
        name,
        email,
        password: hash,
        role: role || "user",
      });

      return res.status(201).json({
        message: `User ${name} created successfully`,
      });
    }

    // =========================
    // ❌ METHOD NOT ALLOWED
    // =========================
    return res.status(405).json({ message: "Method not allowed" });

  } catch (err) {
    console.error("USERS INDEX ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
