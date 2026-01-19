import dbConnect from "../../lib/db.js";
import User from "../../models/User.js";
import { auth } from "../../middleware/auth.js";
import { allow } from "../../middleware/allow.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  const user = auth(req);
  if (!user || !allow(user, "admin")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const users = await User.find().select("-password");
  return res.status(200).json(users);
}
