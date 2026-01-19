import dbConnect from "../../lib/db";
import User from "../../models/User";
import { auth } from "../../middleware/auth";
import { allow } from "../../middleware/allow";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

await dbConnect();

const user = auth(req);
if (!user || !allow(user, "admin")) {
  return res.status(401).json({ message: "Unauthorized" });
}

  const users = await User.find()
    .select("-password")
    .sort({ createdAt: -1 });

  return res.status(200).json(users);
}
