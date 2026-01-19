import dbConnect from "../../lib/db";
import User from "../../models/User";
import { auth } from "../../middleware/auth";
import { allow } from "../../middleware/allow";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    let admin;
    try {
      admin = auth(req);       // 🔐 decode token
      allow(admin, "admin");   // 🔒 check role
    } catch (authErr) {
      return res.status(401).json({ message: authErr.message });
    }

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json(users);

  } catch (err) {
    console.error("LIST USERS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
