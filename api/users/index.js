import bcrypt from "bcryptjs";
import dbConnect from "../../lib/db";
import User from "../../models/User";
import { auth } from "../../middleware/auth";
import { allow } from "../../middleware/allow";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    // 🔐 AUTH CHECK
    const user = auth(req);
    if (!user || !allow(user, "admin")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, email, password, role } = req.body;

    // 🧪 BASIC VALIDATION
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

  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
