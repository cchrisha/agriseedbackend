import bcrypt from "bcryptjs";
import dbConnect from "../../lib/db";
import User from "../../models/User";
import { auth } from "../../middleware/auth";

export default async function handler(req, res) {
  if (req.method !== "PUT")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    await dbConnect();

    const requester = auth(req);

    const { userId, newPassword } = req.body;

    // only admin or self
    if (requester.role !== "admin" && requester.id !== userId)
      throw new Error("Not authorized");

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
}
