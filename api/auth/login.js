import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "../../lib/db";
import User from "../../models/User";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  await dbConnect();

  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    message: `Welcome ${user.name}!`,
    name: user.name,
    role: user.role,
    token
  });
}
