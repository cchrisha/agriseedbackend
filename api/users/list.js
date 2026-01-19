import dbConnect from "../../lib/db";
import User from "../../models/User";
import { auth } from "../../middleware/auth";
import { allow } from "../../middleware/allow";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    await dbConnect();

    const admin = auth(req);
    allow(admin, "admin");

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
}
