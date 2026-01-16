import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "../../lib/db.js";
import User from "../../models/User.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log("LOGIN HIT");
    console.log("ENV CHECK:", {
      mongo: !!process.env.MONGO_URI,
      jwt: !!process.env.JWT_SECRET
    });

    await dbConnect();

    const { email, password } = req.body;
    console.log("BODY:", req.body);

    const user = await User.findOne({ email });
    console.log("USER FOUND:", !!user);

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    console.log("PASSWORD VALID:", valid);

    if (!valid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: `Welcome ${user.name}!`,
      name: user.name,
      role: user.role,
      token
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message
    });
  }
}
