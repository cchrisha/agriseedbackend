import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "../../lib/db.js";
import User from "../../models/User.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
  );

  res.json({ token, role: user.role, name: user.name });
}
